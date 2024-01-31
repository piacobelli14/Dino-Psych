const express = require('express'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
const { Pool } = require('pg'); 
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 

const app = express(); 
const port = 3001; 

app.use(cors());
app.use(bodyParser.json({ limit: '1gb' }));

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
  
    console.log(token); 
  
    if (token === undefined) {
      return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        console.error('JWT Verification Error:', err);
        return res.status(403).json({ message: 'Unauthorized: Invalid token.' });
      }
      req.user = user;
      next();
    });
}

const username = 'piacobelli'
const password = 'PAiac14-'
const pool = new Pool({
    user: username, 
    host: 'localhost', 
    database: 'dinolabs', 
    password: password, 
    port: '5551', 
    max: 6, 
    idleTimeoutMillis: 1000, 
}); 

module.exports = pool;
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err); 
    process.exit(-1)
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
  
      const passwordVerificationQuery = 'SELECT username, salt, hashedpassword, organizationid FROM dinolabsusers WHERE email = $1;';
      const passwordVerificationResult = await pool.query(passwordVerificationQuery, [email]);
  
      if (passwordVerificationResult.error) {
        return res.status(401).json({ message: 'Unable to verify login innfo at this time. Please try again.' });
      }
  
      const row = passwordVerificationResult.rows[0];
      if (!row) {
        return res.status(401).json({ message: 'Unable to verify login innfo at this time. Please try again.' });
      }
  
      const username = row.username; 
      const storedSalt = row.salt;
      const storedHashedPassword = row.hashedpassword;
      const hashedPasswordToCheck = hashPassword(password, storedSalt);
  
      if (hashedPasswordToCheck === storedHashedPassword) {
        const createLoginTokenQuery = 'INSERT INTO dinolabs_signintokens (username, signintimestamp, organizationid) VALUES ($1, NOW(), $2);';
        const createLoginTokenResult = await pool.query(createLoginTokenQuery, [username, row.organizationid]);
  
        if (createLoginTokenResult.error) {
            return res.status(401).json({ message: 'Unable to verify login innfo at this time. Please try again.' });
        }
  
        const token = jwt.sign(
          {
            userId: username,
          },
          '1fafce907062c54ef898e72a20e2e4fab5275e639be048d1d79fdfa5b516459b',
          {
            expiresIn: '1h',
          }
        );

        console.log(token, username); 
  
        return res.status(200).json({ token, username });
      } else {
        return res.status(401).json({ message: 'These login credentials are incorrect. Please try again.' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});  

app.post('/validate-new-user-info', async (req, res) => {
    const {email, username} = req.body; 

    try {
        const infoVerificationQuery = 'SELECT username, email FROM dinolabsusers;';
        const infoVerificationResult = await pool.query(infoVerificationQuery);
    
        if (infoVerificationResult.error) {
            return res.status(500).json({ message: 'Unable to validate user info. Please try again.' });
        }
    
        const rows = infoVerificationResult.rows;
        if (!rows || !Array.isArray(rows)) {
            return res.status(200).json({ message: 'success' });
        }
    
        let emailInUse = false;
        let usernameInUse = false;
    
        for (const row of rows) {
            if (row.email === email) {
            emailInUse = true;
            }
            if (row.username === username) {
            usernameInUse = true;
            }
        }
        if (emailInUse) {
            return res.status(401).json({ message: 'That email is already in use. Please select another.' });
        } else if (usernameInUse) {
            return res.status(401).json({ message: 'That username is taken. Please select another.' });
        }
        return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
}); 

app.post('/create-user', async (req, res) => {
    const { firstName, lastName, username, email, password, phone, organizationID, image } = req.body;
    console.log(req.body); 
    try {
      if (!firstName || !lastName || !username || !email || !password || !phone) {
        return res.status(401).json({ message: 'Unable to verify registration info. Please try again later.' });
      }
  
      const capitalizedFirstName = capitalizeFirstLetter(firstName);
      const capitalizedLastName = capitalizeFirstLetter(lastName);
      const { salt, hashedPassword } = generateSaltedPassword(password);
  
      const userCreationQuery = `
        INSERT INTO dinolabsusers (
            firstname, lastname, username, email, phone, password, hashedpassword, salt, image
        ) 
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        RETURNING *; 
      `;
      
      const userCreationValues = [
        capitalizedFirstName, capitalizedLastName, username.toString(), email.toString(), phone.toString(), password.toString(), hashedPassword.toString(), salt.toString(), image
      ];

      const userCreationResult = await pool.query(userCreationQuery, userCreationValues);
      if (userCreationResult.error) {
        return res.status(500).json({ message: 'Unable to create new user. Please try again later.' });
      }
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function hashPassword(enteredPassword, storedSalt) {
    if (!enteredPassword || !storedSalt) {
        return null;
    }

    const saltedPasswordToCheck = storedSalt + enteredPassword; 
    const hash = crypto.createHash('sha256');   
    const hashedPassword = hash.update(saltedPasswordToCheck).digest('hex'); 
    return hashedPassword;
}

function generateSaltedPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex'); 
    const saltedPassword = salt + password; 
    const hash = crypto.createHash('sha256');
    const hashedPassword = hash.update(saltedPassword).digest('hex'); 
    return { salt, hashedPassword };
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
