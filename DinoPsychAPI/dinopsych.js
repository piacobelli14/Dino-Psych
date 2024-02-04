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

      res.status(200).json({
        maleCount,
        femaleCount,
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
        case 'suicidalityindex': 
            decidedMeasure = 'suicidality index'; 
            decidedMeasureDescription = 'is a measure that determines the likelihood of an individual patient to die by suicide based on self-report psychiatric measures.';
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
                decidedMeasureAnalysis = 'extremely high likelihood of suicide post-discharge.';
            }
            break; 
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
    } else {
        selectedMeasureBuffer = ' A score of ' + `${selectedMeasure === 'suicidalityindex' ? selectedScore+'%' : selectedScore}` + ' indicates a ' + measureSelectionParse(selectedMeasure, selectedScore)[2]
    }

   
    if (decidedPatient == 'patient-wide') {
        var calculatedDescription = 'The average, ' + decidedPatient + ' ' +  measureSelectionParse(selectedMeasure, selectedScore)[0] + ' over six weeks is ' + `${selectedMeasure === 'suicidalityindex' ? selectedScore+'%' : selectedScore}` + '. The ' + measureSelectionParse(selectedMeasure, selectedScore)[0].replace(' score', '') + ' ' + measureSelectionParse(selectedMeasure, selectedScore)[1] + selectedMeasureBuffer
    } else {
        var calculatedDescription = 'The average '+ measureSelectionParse(selectedMeasure, selectedScore)[0] + ' for ' + decidedPatient + ' over six weeks is ' + `${selectedMeasure === 'suicidalityindex' ? selectedScore+'%': selectedScore}` + '. The ' + measureSelectionParse(selectedMeasure, selectedScore)[0].replace(' score', '') + ' ' + measureSelectionParse(selectedMeasure, selectedScore)[1] + selectedMeasureBuffer
    }
    return calculatedDescription;
}


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
