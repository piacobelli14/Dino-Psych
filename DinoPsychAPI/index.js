const express = require('express'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
const { Pool } = require('pg'); 
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 
const { v4: uuidv4 } = require('uuid');

const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key'

const app = express(); 
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.use(cors());
app.use(bodyParser.json({ limit: '1gb' }));

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
  
    if (token === undefined) {
      return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
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
    process.exit(-1)
});

app.get('/', (req, res) => {
    res.send('Express JS on Vercel')
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (req.method !== 'POST') {
        // If not, respond with "Method Not Allowed" error
        return res.status(405).json({ message: 'Method Not Allowed: Use POST method for login.' });
      }
    try {
  
      const passwordVerificationQuery = 'SELECT username, organizationid, salt, hashedpassword FROM dinolabsusers WHERE email = $1;';
      const passwordVerificationResult = await pool.query(passwordVerificationQuery, [email]);
  
      if (passwordVerificationResult.error) {
        return res.status(401).json({ message: 'Unable to verify login innfo at this time. Please try again.' });
      }
  
      const row = passwordVerificationResult.rows[0];
      if (!row) {
        return res.status(401).json({ message: 'Unable to verify login innfo at this time. Please try again.' });
      }

      const username = row.username; 
      let organizationID = row.organizationid; 
      if (!organizationID || organizationID === "" || organizationID === null) {
        organizationID = username
      }
      const storedSalt = row.salt;
      const storedHashedPassword = row.hashedpassword;
      const hashedPasswordToCheck = hashPassword(password, storedSalt);
  
      if (hashedPasswordToCheck === storedHashedPassword) {
        const createLoginTokenQuery = 'INSERT INTO dinolabs_signintokens (username, signintimestamp, organizationid) VALUES ($1, NOW(), $2);';
        const createLoginTokenResult = await pool.query(createLoginTokenQuery, [username, organizationID]);
  
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

app.post('/organization-info', async (req, res) => {
    const { organizationID } = req.body;
    try {
      const userCountQuery = 'SELECT COUNT(*) AS usercount FROM dinolabsusers WHERE organizationid = $1';
      const patientCountQuery = 'SELECT COUNT(*) AS patientcount FROM patientinfo WHERE organizationid = $1';

      if (organizationID === 'null' || organizationID === null || organizationID === '') {
        organizationID = username;
  
        const patientInfoQuery = 'SELECT firstname, lastname, email, image FROM dinolabsusers WHERE username = $1';
        const organizationidResult = await pool.query(patientInfoQuery, [organizationID]);
        const userCountResult = await pool.query(userCountQuery, [organizationID]);
        const patientCountResult = await pool.query(patientCountQuery, [organizationID]);
  
        const organizationInfo = organizationidResult.rows.map(row => ({
          orgtype: 'individual',
          orgname: row.firstname + ' ' + row.lastname,
          orgid: row.email,
          orgimage: row.image,
          userCount: userCountResult.rows[0].usercount,
          patientCount: patientCountResult.rows[0].patientcount,
        }));
        return res.status(200).json(organizationInfo);
      } else {
        const patientInfoQuery = 'SELECT * FROM dinolabsorganizations WHERE orgid = $1';
        const organizationidResult = await pool.query(patientInfoQuery, [organizationID]);
        const userCountResult = await pool.query(userCountQuery, [organizationID]);
        const patientCountResult = await pool.query(patientCountQuery, [organizationID]);

        const organizationInfo = organizationidResult.rows.map(row => ({
          orgtype: 'organization',
          orgname: row.orgname,
          orgid: organizationID,
          orgimage: row.orgimage,
          userCount: userCountResult.rows[0].usercount,
          patientCount: patientCountResult.rows[0].patientcount,
        }));
        return res.status(200).json(organizationInfo);
      }
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
        organizationid: row.organizationid || username,
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
    try {
        const maleCountQuery = `
            SELECT COUNT(*) AS malecount FROM patientinfo WHERE organizationid = $1 AND ptsex = 'M';
        `;

        const femaleCountQuery = `
            SELECT COUNT(*) AS femalecount FROM patientinfo WHERE organizationid = $1 AND ptsex = 'F';
        `;

        const maleAvgQuery = `
            SELECT AVG(ptweight) AS male_avg_weight, AVG(ptheight) AS male_avg_height FROM patientinfo WHERE organizationid = $1 AND ptsex = 'M';
        `;

        const femaleAvgQuery = `
            SELECT AVG(ptweight) AS female_avg_weight, AVG(ptheight) AS female_avg_height FROM patientinfo WHERE organizationid = $1 AND ptsex = 'F';
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

        const { rows: maleAvgRows } = await pool.query(maleAvgQuery, [organizationID]);
        const maleAvgWeight = maleAvgRows[0].male_avg_weight;
        const maleAvgHeight = maleAvgRows[0].male_avg_height;

        const { rows: femaleAvgRows } = await pool.query(femaleAvgQuery, [organizationID]);
        const femaleAvgWeight = femaleAvgRows[0].female_avg_weight;
        const femaleAvgHeight = femaleAvgRows[0].female_avg_height;

        const { rows: ageRows } = await pool.query(ageDistributionQuery, [organizationID]);
        const ageDistribution = ageRows;

        res.status(200).json({
            maleCount,
            femaleCount,
            maleAvgWeight,
            maleAvgHeight,
            femaleAvgWeight,
            femaleAvgHeight,
            ageDistribution
        });
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});


app.post('/patient-search-options', authenticateToken, async (req, res) => {
    const { organizationID } = req.body; 
    try {
        const patientSelectionQuery = `SELECT ptname, ptid FROM patientinfo WHERE organizationid = $1`
        if (organizationID === 'null' || organizationID === null || organizationID === '') {
            organizationID = username;        
        }

        const patientSelectionResult = await pool.query(patientSelectionQuery, [organizationID]);
        if (patientSelectionResult.error) {
            return res.status(500).json({ message: 'Unable to gather patient info at this time. Please try again.' });
        }

        const patientsArray = patientSelectionResult.rows.map(patient => `${patient.ptname} (${patient.ptid})`);
        
        return res.status(200).json({ patientsArray });
    } catch (error) {
        return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/get-distribution-info', async (req, res) => {
    const { organizationID } = req.body;
    try {   
      if (organizationID === 'null' || organizationID === null || organizationID === '') {
        organizationID = username;
      }

      const patientInfoQuery = 'SELECT ptname, ptid FROM patientinfo WHERE organizationid = $1';
      const patientInfoResult = await pool.query(patientInfoQuery, [organizationID]);

      const patientList = patientInfoResult.rows.map(row => ({
        ptname: row.ptname,
        ptid: row.ptid,
      }));
  
      return res.status(200).json({ patientList });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/pull-organization-timepoint-data', authenticateToken, async (req, res) => {
    const { organizationID } = req.body;

    try {
      const patientDataQuery = `SELECT * FROM dinopsych_patientinfo WHERE organizationid = $1 ORDER BY timepoint;`;
      const patientDataResult = await pool.query(patientDataQuery, [organizationID]);
      if (patientDataResult.error) {
        return res.status(500).json({ message: 'Error querying patient data. Please try again later.' });
      }

      const timepointGroups = groupByTimepoint(patientDataResult.rows); 
      const measureAverages = Object.keys(timepointGroups).map(timepoint => ({
        timepoint,
        averages: calculateAverageForGroup(timepointGroups[timepoint]),
      })); 
  
      res.status(200).json({ measureAverages });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/pull-organization-completion-counts', authenticateToken, async (req, res) => {
    const { organizationID } = req.body;
    try {
      if (organizationID === 'null' || organizationID === null || organizationID === '') {
        organizationID = username;
      }
  
      const completionCountQuery = `
        SELECT
            timepoint,
            COUNT(*) as count
        FROM
            dinopsych_patientinfo
        WHERE
            organizationid = $1
        GROUP BY
            timepoint
        ORDER BY
            CASE
                WHEN timepoint = 'W1' THEN 1
                WHEN timepoint = 'W2' THEN 2
                WHEN timepoint = 'W3' THEN 3
                WHEN timepoint = 'W4' THEN 4
                WHEN timepoint = 'W5' THEN 5
                WHEN timepoint = 'W6' THEN 6
                ELSE 7 -- For any other cases, if there are any
            END;
      `;

      const completionCountResult = await pool.query(completionCountQuery, [organizationID]);
      if (completionCountResult.error) {
        return res.status(500).json({ message: 'Error querying patient data. Please try again later.' });
      }
  
      const completionCounts = completionCountResult.rows.reduce((acc, { timepoint, count }) => {
        acc[timepoint] = count;
        return acc;
      }, {});
  
      const maxCount = Math.max(...Object.values(completionCounts));
  
      return res.status(200).json({ completionCounts, maxCount });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/patient-outcomes-data', authenticateToken, async (req, res) => {
    let { organizationID, patientFilter, measureFilter } = req.body;
    try {
        if (organizationID === 'null' || organizationID === null || organizationID === '') {
            organizationID = username;
        }

        if (patientFilter == '' || !patientFilter) {
            patientFilter = null;
        }

        if (measureFilter == '' || !measureFilter) {
            measureFilter = 'suicidalityindex';
        }

        const selectedW1 = [];
        const selectedW2 = [];
        const selectedW3 = [];
        const selectedW4 = [];
        const selectedW5 = [];
        const selectedW6 = [];

        let dataSelectionQuery;
        let queryParameters;
        if (measureFilter !== 'suicidalityindex') {
            if (patientFilter !== null && patientFilter !== 'none') {
                dataSelectionQuery = `SELECT timepoint, ${measureFilter} FROM dinopsych_patientinfo WHERE ptid = $1 AND organizationid = $2;`;
                queryParameters = [patientFilter, organizationID];
            } else {
                orgOnly = true;
                dataSelectionQuery = `SELECT timepoint, ${measureFilter} FROM dinopsych_patientinfo WHERE organizationid = $1;`;
                queryParameters = [organizationID];
            }
        } else {
            if (patientFilter !== null && patientFilter !== 'none') {
                dataSelectionQuery = `SELECT timepoint, phq9, phq15, gad7, psqi, sbqr FROM dinopsych_patientinfo WHERE ptid = $1 AND organizationid = $2;`;
                queryParameters = [patientFilter, organizationID];
            } else {
                orgOnly = true;
                dataSelectionQuery = `SELECT timepoint, phq9, phq15, gad7, psqi, sbqr FROM dinopsych_patientinfo WHERE organizationid = $1;`;
                queryParameters = [organizationID];
            }
        }

        const { rows } = await pool.query(dataSelectionQuery, queryParameters);

        const calculateAverage = (values) => {
            const filteredValues = values.filter(value => !isNaN(value));

            if (filteredValues.length > 0) {
                const sum = filteredValues.reduce((a, b) => a + b);
                return sum / filteredValues.length;
            } else if (values.length > 0) {
                return -99.0;
            } else {
                return null; 
            }
        };

        const calculatePercentageLikelihood = async (phq15, phq9, gad7, psqi, sbqr) => {
            try {
                const jsonData = await fs.readFile('suicidalityIndexV1.json', 'utf-8');
                const data = JSON.parse(jsonData);

                const finalMus = math.matrix(data.final_mus);
                const classConditionals = data.class_conditionals;

                let newInstance = [phq15, phq9, gad7, psqi, sbqr];
                const newInstanceVector = math.transpose(math.matrix(newInstance));

                const classLikelihoods = [];
                for (let i = 0; i < finalMus.size()[0]; i++) {
                    const mean = math.matrix(classConditionals.mean[i]);
                    const covarianceMatrix = math.matrix(classConditionals.covariance_matrix[i]);

                    const diff = math.subtract(newInstanceVector, mean);
                    const covarianceInverse = math.inv(covarianceMatrix);
                    const exponent = math.multiply(-0.5, math.multiply(diff, math.multiply(covarianceInverse, diff)));
                    const likelihood = math.exp(exponent);

                    classLikelihoods.push(likelihood);
                }

                const totalLikelihood = math.sum(classLikelihoods);
                const percentageLikelihoodClass1 = (classLikelihoods[1] / totalLikelihood) * 100;

                return percentageLikelihoodClass1;
            } catch (error) {
                return -99.0; 
            }
        };

        for (const patientData of rows) {
            switch (patientData.timepoint) {
                case 'W1':
                    if (measureFilter === 'suicidalityindex') {
                        w1Data = await calculatePercentageLikelihood(parseFloat(patientData.phq9), parseFloat(patientData.phq15), parseFloat(patientData.gad7), parseFloat(patientData.psqi), parseFloat(patientData.sbqr));
                        selectedW1.push(w1Data);
                    } else {
                        selectedW1.push(parseFloat(patientData[measureFilter]));
                    }
                    break;
                case 'W2':
                    if (measureFilter === 'suicidalityindex') {
                        w2Data = await calculatePercentageLikelihood(parseFloat(patientData.phq9), parseFloat(patientData.phq15), parseFloat(patientData.gad7), parseFloat(patientData.psqi), parseFloat(patientData.sbqr));
                        selectedW2.push(w2Data);
                    } else {
                        selectedW2.push(parseFloat(patientData[measureFilter]));
                    }
                    break;
                case 'W3':
                    if (measureFilter === 'suicidalityindex') {
                        w3Data = await calculatePercentageLikelihood(parseFloat(patientData.phq9), parseFloat(patientData.phq15), parseFloat(patientData.gad7), parseFloat(patientData.psqi), parseFloat(patientData.sbqr));
                        selectedW3.push(w3Data);
                    } else {
                        selectedW3.push(parseFloat(patientData[measureFilter]));
                    }
                    break;
                case 'W4':
                    if (measureFilter === 'suicidalityindex') {
                        w4Data = await calculatePercentageLikelihood(parseFloat(patientData.phq9), parseFloat(patientData.phq15), parseFloat(patientData.gad7), parseFloat(patientData.psqi), parseFloat(patientData.sbqr));
                        selectedW4.push(w4Data);
                    } else {
                        selectedW4.push(parseFloat(patientData[measureFilter]));
                    }
                    break;
                case 'W5':
                    if (measureFilter === 'suicidalityindex') {
                        w5Data = await calculatePercentageLikelihood(parseFloat(patientData.phq9), parseFloat(patientData.phq15), parseFloat(patientData.gad7), parseFloat(patientData.psqi), parseFloat(patientData.sbqr));
                        selectedW5.push(w5Data);
                    } else {
                        selectedW5.push(parseFloat(patientData[measureFilter]));
                    }
                    break;
                case 'W6':
                    if (measureFilter === 'suicidalityindex') {
                        w6Data = await calculatePercentageLikelihood(parseFloat(patientData.phq9), parseFloat(patientData.phq15), parseFloat(patientData.gad7), parseFloat(patientData.psqi), parseFloat(patientData.sbqr));
                        selectedW6.push(w6Data);
                    } else {
                        selectedW6.push(parseFloat(patientData[measureFilter]));
                    }
                    break;
                default:
                    break;
            }
        };

        const selectedW1Avg = calculateAverage(selectedW1) || 0;
        const selectedW2Avg = calculateAverage(selectedW2) || 0;
        const selectedW3Avg = calculateAverage(selectedW3) || 0;
        const selectedW4Avg = calculateAverage(selectedW4) || 0;
        const selectedW5Avg = calculateAverage(selectedW5) || 0;
        const selectedW6Avg = calculateAverage(selectedW6) || 0;

        res.status(200).json(
            {
                trajectoryData: [
                    selectedW1Avg,
                    selectedW2Avg,
                    selectedW3Avg,
                    selectedW4Avg,
                    selectedW5Avg,
                    selectedW6Avg
                ]
            }
        );
    } catch (error) {
        return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/pull-patient-analysis', authenticateToken, async (req, res) => {
    const { selectedPatient, selectedMeasure, selectedScore } = req.body;

    try {
        return res.status(200).json({ text: generateText(selectedPatient, selectedMeasure, selectedScore) });
    } catch (error) {
        return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/pull-patient-timepoint-data', authenticateToken, async (req, res) => {
    const { organizationID, selectedPatient } = req.body; 

    try {
        const patientDataQuery = `SELECT * FROM dinopsych_patientinfo WHERE ptid = $1 AND organizationid = $2;`
        const patientDataResult = await pool.query(patientDataQuery, [selectedPatient, organizationID]); 
        if (patientDataResult.error) {
            return res.status(404).json({ message: 'Unable to gather patient info at this time. Please try again.' });
        }

        const patientDataArray = patientDataResult.rows;

        return res.status(200).json({ patientDataArray });
    } catch {
        return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
}); 

app.post('/check-access-key', async (req, res) => {
    const { surveyKey } = req.body;
    try {
        const surveyKeyResult = await pool.query('SELECT ptid, organizationid, keyaccessed FROM dinopsych_distributionkeys WHERE surveykey = $1', [surveyKey]);
    
        if (surveyKeyResult.rows.length > 0) {
            const keyAccessed = surveyKeyResult.rows[0].keyaccessed;
    
            if (keyAccessed === 'yes') {
                return res.status(500).json({ message: 'That key has already been accessed' });
            } else {
                const patientID = surveyKeyResult.rows[0].ptid;
                const organizationID = surveyKeyResult.rows[0].organizationid;
                
                return res.json({ patientID, organizationID });
            }
        } else {
            return res.status(404).json({ message: 'Survey key not found.' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/increment-timepoint', async (req, res) => {
    let { patientID, organizationID } = req.body;

    try {
      const highestTimepointQuery = 'SELECT MAX(timepoint) AS max_timepoint FROM dinopsych_patientinfo WHERE ptid = $1 AND organizationid = $2';
      const highestTimepointResult = await pool.query(highestTimepointQuery, [patientID, organizationID]);
  
      if (highestTimepointResult.rows.length > 0) {
        const maxTimepoint = highestTimepointResult.rows[0].max_timepoint;
  
        if (maxTimepoint) {
          const incrementedTimepoint = `W${parseInt(maxTimepoint.substring(1)) + 1}`;
          return res.status(200).json({ incrementedTimepoint });
        } else {
          const incrementedTimepoint = 'W1';
          return res.status(200).json({ incrementedTimepoint });
        }
      } else {
        return res.status(404).json({ message: 'No timepoints found for the patient.' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});


app.post('/score-and-store', async (req, res) => {
    const { patientID, organizationID, surveyKey, timepoint, phq15Responses, phq9Responses, phq9_10, gad7Responses, gad7_8A, gad7ResponsesSupplement, psqi_1, psqi_2, psqi_3, psqi_4, psqi_5Responses, psqi_6, psqi_7, psqi_8, psqi_9, sbqr_1, sbqr_2, sbqr_3, sbqr_4 } = req.body;

    try {
        const defaultPHQ15Responses = {
            phq15_1: 0,
            phq15_2: 0,
            phq15_3: 0,
            phq15_4: 0,
            phq15_5: 0,
            phq15_6: 0,
            phq15_7: 0,
            phq15_8: 0,
            phq15_9: 0,
            phq15_10: 0,
            phq15_11: 0,
            phq15_12: 0,
            phq15_13: 0,
            phq15_14: 0,
        };

        const defaultPHQ9Scores = {
            phq9_1: 0,
            phq9_2: 0,
            phq9_3: 0,
            phq9_4: 0,
            phq9_5: 0,
            phq9_6: 0,
            phq9_7: 0,
            phq9_8: 0,
            phq9_9: 0
        }

        const defaultGAD7Scores = {
            gad7_1: 0,
            gad7_2: 0,
            gad7_4: 0,
            gad7_3: 0,
            gad7_5: 0,
            gad7_6: 0,
            gad7_7: 0,
        };

        const defaultGAD7SupplementScores = {
            gad7_8B: 0,
            gad7_8C: 0,
            gad7_8D: 0,
            gad7_8E: 0,
        };

        const defaultPSQI5Scores = {
            psqi_5A: 0,
            psqi_5B: 0,
            psqi_5C: 0,
            psqi_5D: 0,
            psqi_5E: 0,
            psqi_5F: 0,
            psqi_5G: 0,
            psqi_5H: 0,
            psqi_5I: 0,
        };

        const phq15ResponsesMerged = {
            ...defaultPHQ15Responses,
            ...phq15Responses,
        };

        const phq9ResponsesMerged = {
            ...defaultPHQ9Scores, 
            ...phq9Responses
        }; 

        const gad7ResponsesMerged = {
            ...defaultGAD7Scores, 
            ...gad7Responses
        }; 

        const gad7ResponsesSupplementMerged = {
            ...defaultGAD7SupplementScores, 
            ...gad7ResponsesSupplement
        }; 

        const psqi5ResponsesMerged = {
            ...defaultPSQI5Scores, 
            ...psqi_5Responses
        }; 

        const phq15RecodeMapping = {
            'Not bothered at all': 0,
            'Bothered a little': 1,
            'Bothered a lot': 2,
        };

        const phq9RecodeMapping = {
            'Not at all': 0, 
            'Several days': 1, 
            'More than half the days': 2, 
            'Nearly every day': 3,
        };

        const gad7RecodeMapping = {
            'Not at all': 0, 
            'Several days': 1, 
            'More than half the days': 2, 
            'Nearly every day': 3,
        };

        const gad7SupplementRecodeMapping = {
            'No': 0, 
            'Yes': 1,
        };

        const psqi5RecodeMapping = {
            'Not during the past month': 0,
            'Less than once a week': 1,
            'Once or twice a week': 2,
            'Three or more times a week': 3,
        };

        let phq9_10Recoded;
        if (phq9_10 && phq9_10 !== null && phq9_10 !== '') {
            if (phq9_10.split('_')[1] === 'NotDifficult') {
                phq9_10Recoded = 1
            } else if (phq9_10.split('_')[1] === 'SomewhatDifficult') {
                phq9_10Recoded = 2
            } else if (phq9_10.split('_')[1] === 'VeryDifficult') {
                phq9_10Recoded = 3
            } else if (phq9_10.split('_')[1] === 'ExtremelyDifficult') {
                phq9_10Recoded = 4
            }
        } else {
            phq9_10Recoded = 0; 
        }

        let gad7_8ARecoded;
        if (gad7_8A && gad7_8A !== null && gad7_8A !== '') {
            if (gad7_8A.split('_')[1] === 'YesAnxietyAttack') {
                gad7_8ARecoded = 1
            } else if (gad7_8A.split('_')[1] === 'NoAnxietyAttack') {
                gad7_8ARecoded = 0
            }
        } else {
            gad7_8ARecoded = 0; 
        }

        let psqi_6Recoded; 
        if (psqi_6 && psqi_6 !== null && psqi_6 !== '') {
            if (psqi_6.split('_')[1] === '6A') {
                psqi_6Recoded = 0
            } else if (psqi_6.split('_')[1] === '6B') {
                psqi_6Recoded = 1
            } else if (psqi_6.split('_')[1] === '6C') {
                psqi_6Recoded = 2
            } else if (psqi_6.split('_')[1] === '6D') {
                psqi_6Recoded = 3
            }
        } else {
            psqi_6Recoded = 0; 
        }

        let psqi_7Recoded; 
        if (psqi_7 && psqi_7 !== null && psqi_7 !== '') {
            if (psqi_7.split('_')[1] === '7A') {
                psqi_7Recoded = 0
            } else if (psqi_7.split('_')[1] === '7B') {
                psqi_7Recoded = 1
            } else if (psqi_7.split('_')[1] === '7C') {
                psqi_7Recoded = 2
            } 
        } else {
            psqi_7Recoded = 0; 
        }

        let psqi_8Recoded; 
        if (psqi_8 && psqi_8 !== null && psqi_8 !== '') {
            if (psqi_8.split('_')[1] === '8A') {
                psqi_8Recoded = 0
            } else if (psqi_8.split('_')[1] === '8B') {
                psqi_8Recoded = 1
            } else if (psqi_8.split('_')[1] === '8C') {
                psqi_8Recoded = 2
            } 
        } else {
            psqi_8Recoded = 0; 
        }

        let psqi_9Recoded; 
        if (psqi_9 && psqi_9 !== null && psqi_9 !== '') {
            if (psqi_9.split('_')[1] === '9A') {
                psqi_9Recoded = 0
            } else if (psqi_9.split('_')[1] === '9B') {
                psqi_9Recoded = 1
            } else if (psqi_9.split('_')[1] === '9C') {
                psqi_9Recoded = 2
            } else if (psqi_9.split('_')[1] === '9D') {
                psqi_9Recoded = 3
            }
        } else {
            psqi_9Recoded = 0; 
        }

        let sbqr_1Recoded; 
        if (sbqr_1 && sbqr_1 !== null && sbqr_1 !== '') {
            if (sbqr_1.split('_')[1] === '1A') {
                sbqr_1Recoded = 1
            } else if (sbqr_1.split('_')[1] === '1B') {
                sbqr_1Recoded = 2
            } else if (sbqr_1.split('_')[1] === '1C') {
                sbqr_1Recoded = 3
            } else if (sbqr_1.split('_')[1] === '1D') {
                sbqr_1Recoded = 3
            } else if (sbqr_1.split('_')[1] === '1E') {
                sbqr_1Recoded = 4
            } else if (sbqr_1.split('_')[1] === '1F') {
                sbqr_1Recoded = 4
            }
        } else {
            sbqr_1Recoded = 0; 
        }

        let sbqr_2Recoded; 
        if (sbqr_2 && sbqr_2 !== null && sbqr_2 !== '') {
            if (sbqr_2.split('_')[1] === '2A') {
                sbqr_2Recoded = 1
            } else if (sbqr_2.split('_')[1] === '2B') {
                sbqr_2Recoded = 2
            } else if (sbqr_2.split('_')[1] === '2C') {
                sbqr_2Recoded = 3
            } else if (sbqr_2.split('_')[1] === '2D') {
                sbqr_2Recoded = 4
            } else if (sbqr_2.split('_')[1] === '2E') {
                sbqr_2Recoded = 5
            }
        } else {
            sbqr_2Recoded = 0; 
        }

        let sbqr_3Recoded; 
        if (sbqr_3 && sbqr_3 !== null && sbqr_3 !== '') {
            if (sbqr_3.split('_')[1] === '3A') {
                sbqr_3Recoded = 1
            } else if (sbqr_3.split('_')[1] === '3B') {
                sbqr_3Recoded = 2
            } else if (sbqr_3.split('_')[1] === '3C') {
                sbqr_3Recoded = 2
            } else if (sbqr_3.split('_')[1] === '3D') {
                sbqr_3Recoded = 3
            } else if (sbqr_3.split('_')[1] === '3E') {
                sbqr_3Recoded = 3
            }
        } else {
            sbqr_3Recoded = 0; 
        }

        let sbqr_4Recoded; 
        if (sbqr_4 && sbqr_4 !== null && sbqr_4 !== '') {
            if (sbqr_4.split('_')[1] === '4A') {
                sbqr_4Recoded = 0
            } else if (sbqr_4.split('_')[1] === '4B') {
                sbqr_4Recoded = 1
            } else if (sbqr_4.split('_')[1] === '4C') {
                sbqr_4Recoded = 2
            } else if (sbqr_4.split('_')[1] === '4D') {
                sbqr_4Recoded = 3
            } else if (sbqr_4.split('_')[1] === '4E') {
                sbqr_4Recoded = 4
            } else if (sbqr_4.split('_')[1] === '4F') {
                sbqr_4Recoded = 5
            } else if (sbqr_4.split('_')[1] === '4G') {
                sbqr_4Recoded = 6
            }
        } else {
            sbqr_4Recoded = 0; 
        }

        const phq15ResponsesRecoded = Object.fromEntries(
            Object.entries(phq15ResponsesMerged).map(([key, value]) => [key, phq15RecodeMapping[value]])
        );

        const phq9ResponsesRecoded = Object.fromEntries(
            Object.entries(phq9ResponsesMerged).map(([key, value]) => [key, phq9RecodeMapping[value]])
        );

        const gad7ResponsesRecoded = Object.fromEntries(
            Object.entries(gad7ResponsesMerged).map(([key, value]) => [key, gad7RecodeMapping[value]])
        );

        const gad7ResponsesSupplementRecoded = Object.fromEntries(
            Object.entries(gad7ResponsesSupplementMerged).map(([key, value]) => [key, gad7SupplementRecodeMapping[value]])
        );

        const psqi5ResponsesRecoded = Object.fromEntries(
            Object.entries(psqi5ResponsesMerged).map(([key, value]) => [key, psqi5RecodeMapping[value]])
        );

        const phq15ScoringAlg = (dictionary) => {
            let phq15Sum = 0; 
            for (const key in dictionary) {
                if (dictionary[key] !== '') {
                    phq15Sum += Number(dictionary[key])
                }
            }

            return phq15Sum; 
        };
        const phq15Score = phq15ScoringAlg(phq15ResponsesRecoded); 

        const phq9ScoringAlg = (dictionary) => {
            let phq9Sum = 0; 
            for (const key in dictionary) {
                if (dictionary[key] !== '') {
                    phq9Sum += Number(dictionary[key])
                }
            }

            return phq9Sum;
        };
        const phq9Score = phq9ScoringAlg(phq9ResponsesRecoded);

        const gad7ScoringAlg = (dictionary) => {
            let gad7Sum = 0; 
            for (const key in dictionary) {
                if (dictionary[key] !== '') {
                    gad7Sum += Number(dictionary[key])
                }
            }

            return gad7Sum; 
        };
        const gad7Score = gad7ScoringAlg(gad7ResponsesRecoded); 

        const psqiScoringAlg = () => {

            let psqiComp1 = 0; 
            if (psqi_9Recoded !== '') {
                psqiComp1 = psqi_9Recoded
            }

            let psqiComp2 = 0; 
            let summedQ2Q5 = 0; 
            if (parseInt(psqi_2) <= 15) {
                summedQ2Q5 = 0
            } else if (parseInt(psqi_2) >= 16 && parseInt(psqi_2) <= 30) {
                summedQ2Q5 = 1
            } else if (parseInt(psqi_2) >= 31 && parseInt(psqi_2) <= 60) {
                summedQ2Q5 = 2
            } else if (parseInt(psqi_2) > 60) {
                summedQ2Q5 = 3
            }

            if (psqi5ResponsesRecoded.psqi_5A !== '' && psqi5ResponsesRecoded.psqi_5A !== null && psqi5ResponsesRecoded.psqi_5A) {
                summedQ2Q5 = summedQ2Q5 + psqi5ResponsesRecoded.psqi_5A
            }

            if (summedQ2Q5 === 0) {
                psqiComp2 = 0
            } else if (summedQ2Q5 === 1 || summedQ2Q5 === 2) {
                psqiComp2 = 1
            } else if (summedQ2Q5 === 3 || summedQ2Q5 === 4) {
                psqiComp2 = 2
            } else if (summedQ2Q5 === 5 || summedQ2Q5 === 6) {
                psqiComp2 = 3
            }

            let psqiComp3 = 0; 
            if (parseInt(psqi_4) > 7) {
                psqiComp3 = 0
            } else if (parseInt(psqi_4) > 6 && parseInt(psqi_4) <= 7 ) {
                psqiComp3 = 1
            } else if (parseInt(psqi_4) >= 5 && parseInt(psqi_4) <= 6) {
                psqiComp3 = 2
            } else if (parseInt(psqi_4) < 5) {
                psqiComp3 = 3
            }

            let psqiComp4 = 0; 
            let sleepEfficiencyScore = (parseInt(psqi_1)/calculateHoursInBed(psqi_1, psqi_3))*100;
            if (sleepEfficiencyScore > 85) {
                psqiComp4 = 0
            } else if (sleepEfficiencyScore >= 75 && sleepEfficiencyScore <= 84) {
                psqiComp4 = 1
            } else if (sleepEfficiencyScore >= 65 && sleepEfficiencyScore <= 74) {
                psqiComp4 = 2
            } else if (sleepEfficiencyScore < 65) {
                psqiComp4 = 3
            }

            let psqiComp5 = 0; 
            let summedQ5Scores = parseInt(psqi5ResponsesRecoded.psqi_5B || 0) + parseInt(psqi5ResponsesRecoded.psqi_5C || 0) + parseInt(psqi5ResponsesRecoded.psqi_5D || 0) + parseInt(psqi5ResponsesRecoded.psqi_5E || 0) + parseInt(psqi5ResponsesRecoded.psqi_5F || 0) + parseInt(psqi5ResponsesRecoded.psqi_5G || 0) + parseInt(psqi5ResponsesRecoded.psqi_5H || 0) + parseInt(psqi5ResponsesRecoded.psqi_5I || 0);
        
            if (summedQ5Scores === 0) {
                psqiComp5 = 0
            } else if (summedQ5Scores >= 1 && summedQ5Scores <= 9) {
                psqiComp5 = 1
            } else if (summedQ5Scores >= 10 && summedQ5Scores <= 18) {
                psqiComp5 = 2
            } else if (summedQ5Scores >= 19 && summedQ5Scores <= 27) {
                psqiComp5 = 3
            }

            let psqiComp6 = 0; 
            psqiComp6 = psqi_6Recoded

            let psqiComp7 = 0; 
            let summedQ7Q8 = 0;
            if ((psqi_7Recoded !== '' && psqi_7Recoded !== null && psqi_7Recoded) && (psqi_8Recoded !== '' && psqi_8Recoded !== null && psqi_8Recoded)) {
                summedQ7Q8 = parseInt(psqi_7Recoded) + parseInt(psqi_8Recoded);
            } else {
                summedQ7Q8 = 0;
            }

            if (summedQ7Q8 === 0) {
                psqiComp7 = 0
            } else if (summedQ7Q8 === 1 || summedQ7Q8 === 2) {
                psqiComp7 = 1
            } else if (summedQ7Q8 === 3 || summedQ7Q8 === 4) {
                psqiComp7 = 2
            } else if (summedQ7Q8 === 5 || summedQ7Q8 === 6) {
                psqiComp7 = 3
            } 

            let psqiSummedScore = psqiComp1 + psqiComp2 + psqiComp3 + psqiComp4 + psqiComp5 + psqiComp6 + psqiComp7
            return psqiSummedScore; 
        }; 
        const psqiScore = psqiScoringAlg();

        const sbqrScoringAlg = () => {
            let sbqrSummedScore = sbqr_1Recoded + sbqr_2Recoded + sbqr_3Recoded + sbqr_4Recoded
            return sbqrSummedScore; 
        };
        const sbqrScore = sbqrScoringAlg(); 


        const outcomesInsertionQuery = `
            INSERT INTO dinopsych_patientinfo (
                ptid, organizationid, timepoint, phq9, phq15, gad7, psqi, sbqr, 
                phq15_1, phq15_2, phq15_3, phq15_4, phq15_5, phq15_6, phq15_7, phq15_8, phq15_9, phq15_10, phq15_11, phq15_12, phq15_13, phq15_14, 
                phq9_1, phq9_2, phq9_3, phq9_4, phq9_5, phq9_6, phq9_7, phq9_8, phq9_9, phq9_10, 
                gad7_1, gad7_2, gad7_3, gad7_4, gad7_5, gad7_6, gad7_7, gad7_8a, gad7_8b, gad7_8c, gad7_8d, gad7_8e, 
                psqi_1, psqi_2, psqi_3, psqi_4, psqi_5a, psqi_5b, psqi_5c, psqi_5d, psqi_5e, psqi_5f, psqi_5g, psqi_5h, psqi_5i, psqi_6, psqi_7, psqi_8, psqi_9,
                sbqr_1, sbqr_2, sbqr_3, sbqr_4
            ) 
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
                $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65
            );
        `
        const outcomesInsertionValues = [
            patientID, organizationID, timepoint, phq9Score, phq15Score, gad7Score, psqiScore, sbqrScore, 
            phq15ResponsesRecoded.phq15_1, phq15ResponsesRecoded.phq15_2, phq15ResponsesRecoded.phq15_3, phq15ResponsesRecoded.phq15_4, phq15ResponsesRecoded.phq15_5, phq15ResponsesRecoded.phq15_6, phq15ResponsesRecoded.phq15_7, phq15ResponsesRecoded.phq15_8, phq15ResponsesRecoded.phq15_9, phq15ResponsesRecoded.phq15_10, phq15ResponsesRecoded.phq15_11, phq15ResponsesRecoded.phq15_12, phq15ResponsesRecoded.phq15_13, phq15ResponsesRecoded.phq15_14, 
            phq9ResponsesRecoded.phq9_1, phq9ResponsesRecoded.phq9_2, phq9ResponsesRecoded.phq9_3, phq9ResponsesRecoded.phq9_4, phq9ResponsesRecoded.phq9_5, phq9ResponsesRecoded.phq9_6, phq9ResponsesRecoded.phq9_7, phq9ResponsesRecoded.phq9_8, phq9ResponsesRecoded.phq9_9, phq9_10Recoded,
            gad7ResponsesRecoded.gad7_1, gad7ResponsesRecoded.gad7_2, gad7ResponsesRecoded.gad7_3, gad7ResponsesRecoded.gad7_4, gad7ResponsesRecoded.gad7_5, gad7ResponsesRecoded.gad7_6, gad7ResponsesRecoded.gad7_7, gad7_8ARecoded, gad7ResponsesSupplementRecoded.gad7_8B,  gad7ResponsesSupplementRecoded.gad7_8C, gad7ResponsesSupplementRecoded.gad7_8D, gad7ResponsesSupplementRecoded.gad7_8E,
            psqi_1, psqi_2, psqi_3, psqi_4, psqi5ResponsesRecoded.psqi_5A, psqi5ResponsesRecoded.psqi_5B, psqi5ResponsesRecoded.psqi_5C, psqi5ResponsesRecoded.psqi_5D, psqi5ResponsesRecoded.psqi_5E, psqi5ResponsesRecoded.psqi_5F, psqi5ResponsesRecoded.psqi_5G, psqi5ResponsesRecoded.psqi_5H, psqi5ResponsesRecoded.psqi_5I, psqi_6Recoded, psqi_7Recoded, psqi_8Recoded, psqi_9Recoded, 
            sbqr_1Recoded, sbqr_2Recoded, sbqr_3Recoded, sbqr_4Recoded
        ]

        const patientDataResult = await pool.query(outcomesInsertionQuery, outcomesInsertionValues);
        if (patientDataResult.error) {
            return res.status(500).json({ message: 'Error querying patient data. Please try again later.' });
        }

        const surveyKeyKillQuery = 'UPDATE dinopsych_distributionkeys SET keyaccessed = \'yes\' WHERE surveykey = $1';
        const surveyKeyKillResult = await pool.query(surveyKeyKillQuery, [surveyKey]);
        if (surveyKeyKillResult.rowCount === 0) {
          return res.status(500).json({ message: 'Error saving data. Please try again later.' });
        }
        
        return res.status(200).json()

    } catch (error) {
        return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/user-usage-data', authenticateToken, async (req, res) => {
    const { username } = req.body;
    try {
      const gatherUserUsageQuery = `
        SELECT date_trunc('day', current_date - offs) AS day, COUNT(signintimestamp) AS count
        FROM generate_series(0, 6) AS offs
        LEFT JOIN dinolabs_signintokens ON date_trunc('day', signintimestamp) = date_trunc('day', current_date - offs)
        AND username = $1
        GROUP BY day
        ORDER BY day;
      `;
  
      const gatherUserUsageResult = await pool.query(gatherUserUsageQuery, [username]);
      if (gatherUserUsageResult.error) {
        return res.status(500).json({ message: 'Unable to gather usage data at this time. Please try again.' });
      }
  
      const userData = gatherUserUsageResult.rows;
      const timestamps = {};
      userData.forEach(row => {
        const isoTimestamp = row.day.toISOString();
        const dateOnly = isoTimestamp.split('T')[0];
        timestamps[dateOnly] = row.count;
      }); 
  
      return res.status(200).json({ message: "success", timestamps });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});  

app.post('/organization-usage-data', authenticateToken, async (req, res) => {
    const { organizationID } = req.body;
    try {
      const gatherOrganizationUsageQuery = `
        SELECT date_trunc('day', current_date - offs) AS day, COUNT(signintimestamp) AS count
        FROM generate_series(0, 6) AS offs
        LEFT JOIN dinolabs_signintokens ON date_trunc('day', signintimestamp) = date_trunc('day', current_date - offs)
        AND organizationid = $1
        GROUP BY day
        ORDER BY day;
      `;
  
      const gatherOrganizationUsageResult = await pool.query(gatherOrganizationUsageQuery, [organizationID]);
  
      if (gatherOrganizationUsageResult.error) {
        return res.status(500).json({ message: 'Unable to gather organization usage info at this time. Please try again.' });
      }
  
      const userData = gatherOrganizationUsageResult.rows;
      const timestamps = {};
  
      userData.forEach(row => {
        const isoTimestamp = row.day.toISOString();
        const dateOnly = isoTimestamp.split('T')[0];
        timestamps[dateOnly] = row.count;
      });
  
      return res.status(200).json({ timestamps });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});  

app.post('/organization-signin-log', authenticateToken, async (req, res) => {
    const { organizationID } = req.body; 
    try {
      const organizationLoginsQuery = 'SELECT username, signintimestamp FROM dinolabs_signintokens WHERE organizationid = $1 ORDER BY signintimestamp DESC;';

      const organizationLoginsResult = await pool.query(organizationLoginsQuery, [organizationID]);
      if (organizationLoginsResult.error) {
        return res.status(500).json({ message: 'Unable to gather organization usage info at this time. Please try again.' });
      }
  
      const signInsData = [];
      for (const row of organizationLoginsResult.rows) {
        const userDetailsQuery = 'SELECT firstname, lastname FROM dinolabsusers WHERE username = $1;';
        const userDetailsResult = await pool.query(userDetailsQuery, [row.username]);
  
        if (userDetailsResult.error) {
          return res.status(500).json({ message: 'Unable to gather organization usage info at this time. Please try again.' });
        }
  
        const userDetails = userDetailsResult.rows[0];
        const signInData = {
          timestamp: row.signintimestamp.toISOString(),
          firstname: userDetails.firstname,
          lastname: userDetails.lastname,
        };
  
        signInsData.push(signInData);
      }
      return res.status(200).json({ signInsData });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/admin-data', authenticateToken, async (req, res) => {
    const {username, organizationID} = req.body; 
    try {
  
      const isAdminQuery = 'SELECT isadmin FROM dinolabsusers WHERE username = $1';
      const gatherAdminInfoQuery = 'SELECT u.firstname, u.lastname, u.username, u.email, u.isadmin FROM dinolabsusers u WHERE u.organizationid = $1;';
  
      const isAdminResult = await pool.query(isAdminQuery, [username]);
      if (isAdminResult.error || isAdminResult.rows.length === 0 || isAdminResult.rows[0].isadmin !== 'admin') {
        return res.status(200).json([]);
      }

      const gatherAdminInfoResult = await pool.query(gatherAdminInfoQuery, [organizationID]);
      if (gatherAdminInfoResult.error) {
        return res.status(500).json({ message: 'Unable to gather admin info at this time. Please try again.' });
      }
      const users = gatherAdminInfoResult.rows;
      return res.status(200).json({ users });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/pull-notifications', authenticateToken, async (req, res) => {
    const { organizationID } = req.body;
    try {
      const adminNotificationsQuery = 'SELECT request_username FROM dinolabs_accessrequests WHERE request_orgid = $1 AND request_status = \'Current\';';
  
      const adminNotificationsResult = await pool.query(adminNotificationsQuery, [organizationID]);
      if (adminNotificationsResult.error) {
        return res.status(500).json({ message: 'Unable to gather admin notifications at this time. Please try again.' });
      }
      const requestUsernames = adminNotificationsResult.rows.map(row => row.request_username);
      return res.status(200).json({ requestUsernames });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/update-admin-users', authenticateToken, async (req, res) => {
    const adminUsers = req.body.adminUsers;
    const values = adminUsers.map(user => `('${user.isadmin}', '${user.username}')`).join(',');
    try {
      const updateAdminUsersQuery = `
        UPDATE dinolabsusers
        SET isadmin = data.isadmin
        FROM (VALUES ${values}) AS data(isadmin, username)
        WHERE dinolabsusers.username = data.username;
      `;
  
      const updateAdminUsersResult = await pool.query(updateAdminUsersQuery);
  
      if (updateAdminUsersResult.error) {
        return res.status(500).json({ message: 'Unable to update admin users at this time. Please try again.' });
      }

      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/remove-admin-users', authenticateToken, async (req, res) => {
    const { deletedUsernames } = req.body;
    try {
      if (!deletedUsernames || !Array.isArray(deletedUsernames)) {
        return res.status(400).json({ message: 'unable to update admin users at this time. Please try again.' });
      }
  
      const updateAdminUsersQuery = `
          UPDATE dinolabsusers
          SET organizationid = null, isadmin = 'no'
          WHERE username IN (${deletedUsernames.map((_, index) => `$${index + 1}`).join(', ')});
      `;
  
      const updateAdminUsersResult = await pool.query(updateAdminUsersQuery, deletedUsernames);
  
      if (updateAdminUsersResult.error) {
        return res.status(500).json({ message: 'Unable to update admin users at this time. Please try again.' });
      }
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/edit-first-name', authenticateToken, async (req, res) => {
    const { username, firstName } = req.body;
    try {
      const updateFirstNameQuery = `
          UPDATE dinolabsusers
          SET firstname = $1
          WHERE username = $2;
      `;
  
      const updateFirstNameResult = await pool.query(updateFirstNameQuery, [firstName, username]);
  
      if (updateFirstNameResult.error) {
        return res.status(500).json({ message: 'Unable to update user info at this time. Please try again.' });
      }
  
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});
  
app.post('/edit-last-name', authenticateToken, async (req, res) => {
    const { username, lastName } = req.body;
    try {
      const updateLastNameQuery = `
          UPDATE dinolabsusers
          SET lastname = $1
          WHERE username = $2;
      `;
  
      const updateLastNameResult = await pool.query(updateLastNameQuery, [lastName, username]);
  
      if (updateLastNameResult.error) {
        return res.status(500).json({ message: 'Unable to update user info at this time. Please try again.' });
      }
  
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});  

app.post('/edit-email', authenticateToken, async (req, res) => {
    const { username, email } = req.body;
    try {
      const updateEmailQuery = `
          UPDATE dinolabsusers
          SET email = $1
          WHERE username = $2;
      `;
  
      const updateEmailResult = await pool.query(updateEmailQuery, [email, username]);
      if (updateEmailResult.error) {
        return res.status(500).json({ message: 'Unable to update user info at this time. Please try again.' });
      }
  
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});  

app.post('/edit-phone', authenticateToken, async (req, res) => {
    const { username, phone } = req.body;
    try {
      const updatePhoneQuery = `
          UPDATE dinolabsusers
          SET phone = $1
          WHERE username = $2;
      `;
  
      const updatePhoneResult = await pool.query(updatePhoneQuery, [phone, username]);
      if (updatePhoneResult.error) {
        return res.status(500).json({ message: 'Unable to update user info at this time. Please try again.' });
      }
  
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});  

app.post('/edit-image', authenticateToken, async (req, res) => {
    const { username, image } = req.body;
    try {
      const updateImageQuery = `
          UPDATE dinolabsusers
          SET image = $1
          WHERE username = $2;
      `;
  
      const updateImageResult = await pool.query(updateImageQuery, [image, username]);
  
      if (updateImageResult.error) {
        return res.status(500).json({ message: 'failure' });
      }
  
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/confirm-access', authenticateToken, async (req, res) => {
    const { notificationUsername, organizationID } = req.body;
    try {
      const updateAccessRequestsQuery = 'UPDATE dinolabs_accessrequests SET request_status = \'Confirmed\' WHERE request_username = $1 AND request_orgid = $2;';
      const updateUsersQuery = 'UPDATE dinolabsusers SET organizationid = $1 WHERE username = $2;';
  
      const initialUpdateResult = await pool.query(updateAccessRequestsQuery, [notificationUsername, organizationID]);
      if (initialUpdateResult.error) {
        return res.status(500).json({ message: 'Unable to confirm access at this time. Please try again.' });
      }
  
      const followupUpdateResult = await pool.query(updateUsersQuery, [organizationID, notificationUsername]);
      if (followupUpdateResult.error) {
        return res.status(500).json({ message: 'Unable to confirm access at this time. Please try again.' });
      }
  
      return res.status(200).json({ message: 'success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});
  
app.post('/deny-access', authenticateToken, async (req, res) => {
    const { notificationUsername, organizationID } = req.body;
    try {
      const deleteUserQuery = `
        UPDATE dinolabs_accessrequests
        SET request_status = 'Denied'
        WHERE request_username = $1 AND request_orgid = $2;
      `;
  
      await pool.query(deleteUserQuery, [notificationUsername, organizationID]);
      
      res.status(200).json({ message: 'success' });
    } catch (error) {
      res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/create-team', authenticateToken, async (req, res) => {
    try {
      const { username, teamName } = req.body;
  
      const generateRandomOrgId = () => {
        return Math.floor(100000 + Math.random() * 900000);
      };
  
      const isOrgIdUnique = async (organizationID) => {
        const organizationidVerificationQuery = 'SELECT COUNT(*) FROM dinolabsorganizations WHERE orgid = $1';
        const organizationidVerificationResult = await pool.query(organizationidVerificationQuery, [organizationID]);
        return parseInt(organizationidVerificationResult.rows[0].count) === 0;
      };
  
      const isTeamNameUnique = async (teamName) => {
        const teamNameVerificationQuery = 'SELECT COUNT(*) FROM dinolabsorganizations WHERE orgname = $1';
        const teamNameVerificationResult = await pool.query(teamNameVerificationQuery, [teamName]);
        return parseInt(teamNameVerificationResult.rows[0].count) === 0;
      };
  
      const insertTeam = async (organizationID) => {
        const teamCreationQuery = `
            INSERT INTO dinolabsorganizations
            (orgname, orgid)
            VALUES ($1, $2);
        `;
        await pool.query(teamCreationQuery, [teamName, organizationID]);
  
        const teamUpdateQuery = `
            UPDATE dinolabsusers
            SET organizationid = $1, isadmin = 'admin'
            WHERE username = $2;
        `;
        await pool.query(teamUpdateQuery, [organizationID, username]);

        res.status(200).json({ message: "success" });
      };
  
      let uniqueOrgId = generateRandomOrgId();
      const checkAndInsert = async () => {
        while (!(await isOrgIdUnique(uniqueOrgId))) {
          uniqueOrgId = generateRandomOrgId();
        }
  
        if (await isTeamNameUnique(teamName) && teamName !== '' && teamName !== null) {
          await insertTeam(uniqueOrgId);
        } else {
          res.status(401).json({ message: 'Unable to create team at this time. Please try again.' });
        }
      };
  
      await checkAndInsert();
    } catch (error) {
      res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/join-team', authenticateToken, (req, res) => {
    const { username, firstName, lastName, teamCode } = req.body;
    
    const isCodeValid = (teamCode, callback) => {
        const codeVerificationQuery = `SELECT orgname FROM dinolabsorganizations WHERE orgid = $1;`
        pool.query(codeVerificationQuery, [teamCode], (error, codeVerificationResult) => {
            if (error) {
                return callback(error);
            }

            if (codeVerificationResult.rows.length === 0) {
                callback(null, false);
            } else {
                callback(null, true);
            }
        });
    };

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
        subject: 'Access Request',
        text: `Hi! \n\n${firstName} ${lastName} (${username}) has requested access to your team. Please review this notification in your dashboard and take appropriate action.\n\nSincerely,\nThe DinoLabs Team`,
    };

    const requestAccess = () => {
        isCodeValid(teamCode, (error, isValid) => {
            if (error) {
                return res.status(500).json({ message: 'Unable to request team access at this time. Please try again.' });
            }
    
            if (isValid) {
                const adminEmailQuery = `SELECT email FROM dinolabsusers WHERE organizationid = $1 AND isadmin = 'admin';`
                pool.query(adminEmailQuery, [teamCode], (error, adminEmailResult) => {
                    if (error) {
                        return res.status(500).json({ message: 'Unable to request team access at this time. Please try again.' });
                    }
    
                    const adminEmails = adminEmailResult.rows.map((row) => row.email);
    
                    const checkActiveRequestQuery = `
                        SELECT * FROM dinolabs_accessrequests 
                        WHERE request_username = $1 AND request_status = 'Current'
                    `;
    
                    pool.query(checkActiveRequestQuery, [username], (error, checkActiveRequestResult) => {
                        if (error) {
                            return res.status(500).json({ message: 'Unable to request team access at this time. Please try again.' });
                        }
    
                        if (checkActiveRequestResult.rows.length > 0) {
                            const updateActiveRequestQuery = `
                                UPDATE dinolabs_accessrequests
                                SET request_timestamp = NOW()
                                WHERE request_username = $1 AND request_orgid = $2 AND request_status = 'Current'
                            `;
    
                            let updateActiveRequestResult; 

                            pool.query(updateActiveRequestQuery, [username, teamCode], (error, result) => {
                                if (error) {
                                    return res.status(500).json({ message: 'Unable to request team access at this time. Please try again.' });
                                }
                                
                                updateActiveRequestResult = result;
                            });
                        } else {
                            const requestLogQuery = `
                                INSERT INTO dinolabs_accessrequests 
                                (request_username, request_orgid, request_timestamp, request_status)
                                VALUES ($1, $2, NOW(), 'Current')
                            `;
    
                            pool.query(requestLogQuery, [username, teamCode], (error, requestLogResult) => {
                                if (error) {
                                    return res.status(500).json({ message: 'Unable to request team access at this time. Please try again.' });
                                }
                            });
                        }

                        adminEmails.forEach((email) => {
                            mailOptions.to = email;
    
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    return res.status(500).json({ message: 'Unable to request team access at this time. Please try again.' });
                                }
                            });
                        });
                        res.status(200).json({ message: "success" });
                    });
                });
            } else {
                return res.status(401).json({ message: 'There are no teams associated with that code. Please try again or contact your admin to get the correct code.' });
            }
        });
    };
    requestAccess();
});

app.post('/pull-my-requests', authenticateToken, async (req, res) => {
    const { username } = req.body; 
    console.log(req.body); 
    try {
        const accessRequestQuery = `SELECT request_username, request_status FROM dinolabs_accessrequests WHERE request_username = $1 AND request_status = 'Current';`;

        const { rows } = await pool.query(accessRequestQuery, [username]);

        if (rows.length > 0) {
            res.status(200).json({ orgRequest: rows });
        } else {
            res.status(404).json({ message: 'No active access requests found for the user.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to the database. Please try again later.' });
    }
});

app.post('/distribute-survey', authenticateToken, async (req, res) => {
    const { organizationID, patientIDs } = req.body;
    console.log(req.body); 
    try {
      if (organizationID === 'null' || organizationID === null || organizationID === '') {
        organizationID = username;
      }
  
      for (const patientID of patientIDs) {
        const getEmailQuery = `SELECT ptemail FROM patientinfo WHERE ptid = $1 AND organizationid = $2`;
        const getEmailResult = await pool.query(getEmailQuery, [patientID, organizationID]);
  
        if (getEmailResult.rows.length === 0) {
          continue; 
        }
  
        const patientEmail = getEmailResult.rows[0].ptemail;

        let surveyKey;
        let keyExists = true;
  
        while (keyExists) {
          surveyKey = uuidv4();
  
          const keyCheckResult = await pool.query('SELECT surveykey FROM dinopsych_distributionkeys WHERE organizationid = $1 AND surveykey = $2', [organizationID, surveyKey]);
          if (keyCheckResult.rows.length === 0) {
            keyExists = false;
          }
        }
  
        await pool.query('INSERT INTO dinopsych_distributionkeys (ptid, organizationid, surveykey) VALUES ($1, $2, $3)', [patientID, organizationID, surveyKey]);
  
        const surveyLink = `http://localhost:5173/survey/${surveyKey}`;
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
          to: patientEmail,
          subject: 'Survey Link',
          text: `Hi!,\n\nIt's time to fill out another survey. Click the link below to get started.\n\n${surveyLink}\n\nThans for your time!\n\nSincerely,\nThe DinoLabs Team`,
        };
  
        await delay(1000);
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return;
          } 
        });
      }
  
      return res.status(200).json();
    } catch (error) {
        console.log(error);
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

const calculateHoursInBed = (bedtime, waketime) => {
    let [bedHours, bedMinutes] = bedtime.split(':').map(str => parseInt(str, 10));
    let [wakeHours, wakeMinutes] = waketime.split(':').map(str => parseInt(str, 10));

    const isBedtimePM = /pm/i.test(bedtime);

    if (isBedtimePM && bedHours !== 12) {
        bedHours += 12;
    }

    if (/pm/i.test(waketime) && wakeHours !== 12) {
        wakeHours += 12;
    }

    let hoursInBed = wakeHours - bedHours;
    let minutesInBed = wakeMinutes - bedMinutes;

    if (minutesInBed < 0) {
        hoursInBed -= 1;
        minutesInBed += 60;
    }

    return hoursInBed;
};

function groupByTimepoint(rows) {
    const groups = {};
    rows.forEach(row => {
        const timepoint = row.timepoint;
        if (!groups[timepoint]) {
        groups[timepoint] = [];
        }
        groups[timepoint].push(row);
    }); 
    return groups;
}

function calculateAverageForGroup(group) {
    const measureAverages = {};
    const measures = ['phq9', 'phq15', 'gad7', 'psqi', 'sbqr']; 

    measures.forEach(measure => {
        const values = group.map(data => data[measure]);
        measureAverages[measure] = calculateAverage(values);
    });

    return measureAverages;
}

function calculateAverage(values) {
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
}

function measureSelectionParse(selectedMeasure, selectedScore) {
    selectedScore = parseFloat(selectedScore); 
    selectedScore = selectedScore; 
    selectedScore = selectedScore.toString()

    var decidedMeasureAnalysis; 
    switch(selectedMeasure) {
        case 'phq9': 
            decidedMeasure = 'PHQ-9 score'; 
            decidedMeasureDescription = 'is a self-report measure that determines the presence and severity of depression for an individual patient.';
            if (selectedScore <= 4) {
                decidedMeasureAnalysis = 'low likelihood for the presence of clinical depression or depressive symptoms.';
            } else if (selectedScore >= 5 && selectedScore <= 14) {
                decidedMeasureAnalysis = 'mild likelihood for the presence of clinical depression or depressive symptoms.';
            } else if (selectedScore >= 15 && selectedScore <= 19) {
                decidedMeasureAnalysis = 'moderate likelihood for the presence of clinical depression or depressive symptoms.';
            } else {
                decidedMeasureAnalysis = 'high likelihood for the presence of clinical depression or depressive symptoms.';
            }
            break; 
        case 'phq15': 
            decidedMeasure = 'PHQ-15 score'; 
            decidedMeasureDescription = 'is a self-report measure that screens and rates the physical health of an individual patient and their consequent risk for somatic disorders.';
            decidedMeasureAnalysis = '';
            break; 
        case 'gad7': 
            decidedMeasure = 'GAD-7 score'; 
            decidedMeasureDescription = 'is a self-report measure that determines the presence and severity of anxiety for an individual patient.';
            if (selectedScore <= 4) {
                decidedMeasureAnalysis = 'low likelihood for the presence of clinical anxiety or anxiety symptoms.';
            } else if (selectedScore >= 5 && selectedScore <= 9) {
                decidedMeasureAnalysis = 'mild likelihood for the presence of clinical anxiety or anxiety symptoms.';
            } else if (selectedScore >= 10 && selectedScore <= 14) {
                decidedMeasureAnalysis = 'moderate likelihood for the presence of clinical anxiety or anxiety symptoms.';
            } else {
                decidedMeasureAnalysis = 'high likelihood for the presence of clinical anxiety or anxiety symptoms.';
            }
            break; 
        case 'sbqr': 
            decidedMeasure = 'SBQ-R score'; 
            decidedMeasureDescription = 'is a self-report measure that screens an individual patient for the presence and severity of suicidal ideation.';
            if (selectedScore <= 3) {
                decidedMeasureAnalysis = 'low likelihood for the existence of suicidal ideation.';
            } else if (selectedScore == 4) {
                decidedMeasureAnalysis = 'mild likelihood for the existence of suicidal ideation.';
            } else if (selectedScore >= 5 && selectedScore <= 7) {
                decidedMeasureAnalysis = 'moderate likelihood for the existence of suicidal ideation.';
            } else {
                decidedMeasureAnalysis = 'high likelihood for the existence of suicidal ideation.';
            }
            break; 
        case 'psqi': 
            decidedMeasure = 'PSQI score'; 
            decidedMeasureDescription = 'is a self-report measure that screens and rates the quality of sleep for an individual patient.';
            if (selectedScore <= 4) {
                decidedMeasureAnalysis = 'low likelihood for the existence of sleep problems.';
            } else if (selectedScore >= 5 && selectedScore <= 9) {
                decidedMeasureAnalysis = 'mild likelihood for the existence of sleep problems.';
            } else if (selectedScore >= 10 && selectedScore <= 14) {
                decidedMeasureAnalysis = 'moderate likelihood for the existence of sleep problems.';
            } else {
                decidedMeasureAnalysis = 'high likelihood for the existence of sleep problems.';
            }
            break; 
        default: 
            decidedMeasure = 'suicidality index'
            decidedMeasureDescription = 'is a measure that determines the likelihood of an individual patient to die by suicide based on self-report psychiatric measures.'
            if (selectedScore <= 12) {
                decidedMeasureAnalysis = 'extremely low likelihood of suicide post-discharge.';
            } else if (selectedScore >= 13 && selectedScore <= 30) {
                decidedMeasureAnalysis = 'low likelihood of suicide post-discharge.';
            } else if (selectedScore >= 31 && selectedScore <= 50) {
                decidedMeasureAnalysis = 'mild likelihood of suicide post-discharge.';
            } else if (selectedScore >= 51 && selectedScore <= 80) {
                decidedMeasureAnalysis = 'moderate likelihood of suicide post-discharge.';
            } else if (selectedScore >= 81 && selectedScore <= 90) {
                decidedMeasureAnalysis = 'high likelihood of suicide post-discharge.';
            } else {
                decidedMeasureAnalysis = 'extremely high likelihood  of suicide post-discharge.';
            }
            break;
    }
    return [decidedMeasure, decidedMeasureDescription, decidedMeasureAnalysis, selectedScore];
}

function generateText(selectedPatient, selectedMeasure, selectedScore) {
    var decidedPatient;
    if (!selectedPatient || selectedPatient == '') {
        decidedPatient = 'patient-wide';
    } else {
        decidedPatient = selectedPatient;
    }

    selectedScore = parseFloat(selectedScore); 
    selectedScore = selectedScore.toFixed(1);
    selectedScore = selectedScore.toString()

    if (measureSelectionParse(selectedMeasure, selectedScore)[2].includes('extremely')) {
        selectedMeasureBuffer = ' A score of ' + `${selectedMeasure === 'suicidalityindex' ? selectedScore+'%' : selectedScore}` + ' indicates an ' + measureSelectionParse(selectedMeasure, selectedScore)[2]
    } else if (measureSelectionParse(selectedMeasure, selectedScore)[2] !== "") {
        selectedMeasureBuffer = ' A score of ' + `${selectedMeasure === 'suicidalityindex' ? selectedScore+'%' : selectedScore}` + ' indicates a ' + measureSelectionParse(selectedMeasure, selectedScore)[2]
    } else {
        selectedMeasureBuffer = ''; 
    }

   
    if (decidedPatient == 'patient-wide') {
        var calculatedDescription = 'The average, ' + decidedPatient + ' ' +  measureSelectionParse(selectedMeasure, selectedScore)[0] + ' over six weeks is ' + `${selectedMeasure === 'suicidalityindex' ? selectedScore+'%' : selectedScore}` + '. The ' + measureSelectionParse(selectedMeasure, selectedScore)[0].replace(' score', '') + ' ' + measureSelectionParse(selectedMeasure, selectedScore)[1] + selectedMeasureBuffer
    } else {
        var calculatedDescription = 'The average '+ measureSelectionParse(selectedMeasure, selectedScore)[0] + ' for ' + decidedPatient + ' over six weeks is ' + `${selectedMeasure === 'suicidalityindex' ? selectedScore+'%': selectedScore}` + '. The ' + measureSelectionParse(selectedMeasure, selectedScore)[0].replace(' score', '') + ' ' + measureSelectionParse(selectedMeasure, selectedScore)[1] + selectedMeasureBuffer
    }
    return calculatedDescription;
}

module.exports = app;