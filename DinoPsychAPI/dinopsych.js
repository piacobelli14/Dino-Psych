const express = require('express'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
const { Pool } = require('pg'); 
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 

const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key'

const app = express(); 
const port = 3001; 

app.use(cors());
app.use(bodyParser.json({ limit: '1gb' }));

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
  
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
  
      const passwordVerificationQuery = 'SELECT username, salt, hashedpassword FROM dinolabsusers WHERE email = $1;';
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
        const createLoginTokenQuery = 'INSERT INTO dinolabs_signintokens (username, signintimestamp) VALUES ($1, NOW());';
        const createLoginTokenResult = await pool.query(createLoginTokenQuery, [username]);
  
        if (createLoginTokenResult.error) {
            return res.status(401).json({ message: 'Unable to verify login innfo at this time. Please try again.' });
        }
  
        if (hashedPasswordToCheck === storedHashedPassword) {
            const token = jwt.sign(
              {
                userId: username,
              },
              secretKey,
              {
                expiresIn: '7d', 
              }
            );

            return res.status(200).json({ token, username });
        } else {
            return res.status(401).json({ message: 'These login credentials are incorrect. Please try again.' });
        }
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
            return res.status(200).json({});
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
        return res.status(200).json({});
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
}); 

app.post('/create-user', async (req, res) => {
    const { firstName, lastName, username, email, password, phone, image } = req.body;
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
      } else {
        return res.status(200).json({});
      }
        
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/reset-password', async (req, res) => {
    const { email } = req.body;
    try {
      const resetVerificationQuery = 'SELECT email, phone, password FROM dinolabsusers WHERE email = $1;';
      const resetVerificationResult = await pool.query(resetVerificationQuery, [email]);
  
      if (resetVerificationResult.error) {
        return res.status(500).json({ message: 'Unable to send verification email. Please try again later.' });
      }
  
      const row = resetVerificationResult.rows[0];
      if (!row) {
        return res.status(401).json({ message: 'Unable to send verification email. Please try again later.' });
      }
  
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTimestamp = new Date();
      expirationTimestamp.setMinutes(expirationTimestamp.getMinutes() + 3);
  
      const createResetTokenQuery = `
        INSERT INTO dinolab_resettokens 
        (username, resettoken, expirationtimestamp) 
        VALUES ($1, $2, $3) 
        RETURNING *;
      `;
  
      const createResetTokenValues = [email, resetCode, expirationTimestamp.toISOString()];
      const createResetTokenResult = await pool.query(createResetTokenQuery, createResetTokenValues);
  
      if (createResetTokenResult.error) {
        return res.status(500).json({ message: 'Unable to send verification email. Please try again later.' });
      }
  
      const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: 'dinolabsauthentication@outlook.com',
          pass: 'PAiac14-',
        },
      });
  
      const mailOptions = {
        from: 'dinolabsauthentication@outlook.com',
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${resetCode}`,
      };
  
      const sendMailResult = await transporter.sendMail(mailOptions);
      if (sendMailResult.error) {
        return res.status(500).json({ message: 'Unable to send verification email. Please try again later.' });
      }
  
      return res.status(200).json({
        message: 'Password reset code sent.',
        data: {
          resetCode: resetCode,
          resetExpiration: expirationTimestamp.toISOString(),
          currentPassword: row.password,
          currentEmail: row.email,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database or sending email. Please try again later.' });
    }
});

app.post('/change-password', async (req, res) => {
    const { newPassword, email } = req.body;
    try {
      const { salt, hashedPassword } = generateSaltedPassword(newPassword);
      const storedSalt = salt;
      const storedHashedPassword = hashedPassword;
  
      const updatePasswordQuery = 'UPDATE dinolabsusers SET password = $1, hashedpassword = $2, salt = $3 WHERE email = $4;';
      const updatePasswordValues = [newPassword, storedHashedPassword, storedSalt, email];
  
      const updatePasswordResult = await pool.query(updatePasswordQuery, updatePasswordValues);
      if (updatePasswordResult.error) {
        return res.status(500).json({ message: 'Unable to update password. Please try again later.' });
      }

      return res.status(200).json({});
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/user-info', authenticateToken, async (req, res) => {
    const { username } = req.body;
    try {
      const gatherUserInfoQuery = 'SELECT * FROM dinolabsusers WHERE username = $1;';
      const gatherUserInfoResult = await pool.query(gatherUserInfoQuery, [username]);
  
      if (gatherUserInfoResult.error) {
        return res.status(500).json({ message: 'Unable to fetch user info at this time. Please try again later.' });
      }
  
      const formattedResult = gatherUserInfoResult.rows.map(row => ({
        username: username,
        email: row.email,
        firstname: row.firstname,
        lastname: row.lastname,
        image: row.image,
        phone: row.phone,
        organizationid: row.organizationid,
        isadmin: row.isadmin,
      })); 
  
      return res.status(200).json(formattedResult);
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/pull-organization-users', authenticateToken, async (req, res) => {
    const { organizationID } = req.body;
    try {
      const patientInfoQuery = 'SELECT * FROM patientinfo WHERE organizationid = $1;';
      if (organizationID === 'null' || organizationID === null || organizationID === '') {
        organizationID = username;
      }
  
      const patientInfoResult = await pool.query(patientInfoQuery, [organizationID]);
      if (patientInfoResult.error) {
        return res.status(500).json({ message: 'Unable to gather patient information at this time. Please try again.' });
      }
  
      const patientInfoArray = patientInfoResult.rows;
  
      return res.status(200).json({ patientInfoArray });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/selected-user-placeholders', async (req, res) => {
    const { patientID, organizationID } = req.body;
    try {
  
      const placeholderQuery = 'SELECT * FROM patientinfo WHERE ptid = $1::double precision AND organizationid = $2;';
  
      const placeholderResult = await pool.query(placeholderQuery, [patientID, organizationID]);    

      res.status(200).json({ patientInfo: placeholderResult.rows });
    } catch (error) {
      res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/enroll-user', async (req, res) => {
    const { organizationID, firstName, lastName, age, sex, height, weight, image, email } = req.body;
    try {
      const newUserValidationQuery = 'SELECT ptid FROM patientinfo';
      const newUserArchiveValidationQuery = 'SELECT ptid FROM patientinfo_archive';
      const userInsertionQuery = 'INSERT INTO patientinfo (ptid, ptname, ptsex, ptage, ptheight, ptweight, ptimage, ptemail, organizationid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  
      let patientID;
      let isUnique = false;
  
      while (!isUnique) {
        patientID = Math.floor(100000 + Math.random() * 900000).toString();
  
        const { rows: currentRows } = await pool.query(newUserValidationQuery);
  
        for (const row of currentRows) {
          if (row.ptid && row.ptid.toString() === patientID) {
            isUnique = false;
            break;
          } else {
            isUnique = true;
          }
        }
  
        if (isUnique) {
          const { rows: archiveRows } = await pool.query(newUserArchiveValidationQuery);
  
          for (const archiveRow of archiveRows) {
            if (archiveRow.ptid && archiveRow.ptid.toString() === patientID) {
              isUnique = false;
              break;
            }
          }
        }
      }
  
      await pool.query(userInsertionQuery, [patientID, `${firstName} ${lastName}`, sex, age, height, weight, image, email, organizationID]);
  
      return res.status(200).json({});
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/edit-user', async (req, res) => {
    const { organizationID, patientID, firstName, lastName, age, sex, height, weight, image, email } = req.body;
    try {
      const editQuery = `
        UPDATE patientinfo
        SET ptname = $1, ptage = $2, ptsex = $3, ptheight = $4, ptweight = $5, ptimage = $6, ptemail = $7
        WHERE ptid = $8::double precision AND organizationid = $9;
      `;
  
      await pool.query(editQuery, [firstName + ' ' + lastName, age, sex, height, weight, image, email, patientID, organizationID]);
  
      res.status(200).json({});
    } catch (error) {
      res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});  

app.post('/discharge-user', async (req, res) => {
    const { organizationID, patientIDs } = req.body;
    try {
        const dischargeQueries = [
            {
                text: `
                    WITH discharged_patients AS (
                        DELETE FROM patientinfo
                        WHERE organizationid = $1 AND ptid = ANY($2::double precision[])
                        RETURNING *
                    )
                    INSERT INTO patientinfo_archive
                    SELECT * FROM discharged_patients
                `,
                values: [organizationID, patientIDs],
            },
            {
                text: `
                    WITH discharged_data AS (
                        DELETE FROM patientdata
                        WHERE organizationid = $1 AND ptid = ANY($2::double precision[])
                        RETURNING *
                    )
                    INSERT INTO patientdata_archive
                    SELECT * FROM discharged_data
                `,
                values: [organizationID, patientIDs],
            },
        ];

        for (const query of dischargeQueries) {
            await pool.query(query.text, query.values);
        }
        return res.status(200).json({});

    } catch (error) {
        return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/delete-user', async (req, res) => {
    const { organizationID, patientIDs } = req.body;
    try {
        const dischargeQueries = [
            {
                text: 'DELETE FROM patientinfo WHERE organizationid = $1 AND ptid = ANY($2::double precision[])',
                values: [organizationID, patientIDs],
            },
            {
                text: 'DELETE FROM patientdata WHERE organizationid = $1 AND ptid = ANY($2::double precision[])',
                values: [organizationID, patientIDs],
            },
        ];
         
        for (const query of dischargeQueries) {
           await pool.query(query.text, query.values);
        }
        return res.status(200).json({});
    } catch (error) {
        return res.status(500).json({ message: 'failure' });
    }
});

app.post('/user-demographic-info', async (req, res) => {
    const { organizationID } = req.body;
    console.log(organizationID); 
    try {
      const maleCountQuery = `
          SELECT COUNT(*) AS malecount FROM patientinfo WHERE organizationid = $1 AND ptsex = 'M';
      `;
      
      const femaleCountQuery = `
          SELECT COUNT(*) AS femalecount FROM patientinfo WHERE organizationid = $1 AND ptsex = 'F';
      `;
  
      const ageDistributionQuery = `
          SELECT
              COALESCE(COUNT(p.ptage), 0) AS count,
              age_range
          FROM (
              SELECT unnest(ARRAY['0-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']) AS age_range
          ) AS ranges
          LEFT JOIN patientinfo p ON
              organizationid = $1 AND
              CASE
                  WHEN p.ptage BETWEEN 0 AND 17 THEN '0-17'
                  WHEN p.ptage BETWEEN 18 AND 24 THEN '18-24'
                  WHEN p.ptage BETWEEN 25 AND 34 THEN '25-34'
                  WHEN p.ptage BETWEEN 35 AND 44 THEN '35-44'
                  WHEN p.ptage BETWEEN 45 AND 54 THEN '45-54'
                  WHEN p.ptage BETWEEN 55 AND 64 THEN '55-64'
                  WHEN p.ptage >= 65 THEN '65+'
              END = ranges.age_range
          GROUP BY age_range;
      `;
  
      const { rows: maleRows } = await pool.query(maleCountQuery, [organizationID]);
      const maleCount = maleRows[0].malecount;
  
      const { rows: femaleRows } = await pool.query(femaleCountQuery, [organizationID]);
      const femaleCount = femaleRows[0].femalecount;
  
      const { rows: ageRows } = await pool.query(ageDistributionQuery, [organizationID]);
      const ageDistribution = ageRows;

      console.log({
        maleCount,
        femaleCount,
        ageDistribution
      }); 
  
      res.status(200).json({
        maleCount,
        femaleCount,
        ageDistribution
      });
    } catch (error) {
      res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
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
