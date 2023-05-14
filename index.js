const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const port = 3000;
app.use(express.json());


const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const conn = mysql.createConnection({
    host: dbHost, 
    user: dbUser,
    password: dbPassword,
    database: 'myUsers'
})



app.post('/api/register', (req, res) => {
  const { name, password, hwid, license } = req.body;

  const userQuery = `INSERT INTO users (name, password, registerDate, licenseId) 
                     VALUES (?, ?, ?, ?, ?)`;
  const licenseQuery = `SELECT licenseId, used FROM licenses 
                        WHERE license = ? AND Expiry >= NOW()`;

  conn.query(licenseQuery, [license], (err, licenseResults, fields) => {
    if (err) throw err;

    if (licenseResults.length > 0) {
      const licenseId = licenseResults[0].licenseId;
      const used = licenseResults[0].used;

      if (!used) {
        conn.query(userQuery, [name, password, new Date(), licenseId], (err, userResults, fields) => {
          if (err) throw err;

          conn.query(`UPDATE licenses SET used = true WHERE licenseId = ?`, [licenseId], (err, results, fields) => {
            if (err) throw err;

            res.status(200).send("Register Success!");
          });
        });
      } 
      else {
        res.status(400).send('License key has already been used');
      }
    } 
    else {
      res.status(400).send('Invalid or expired license key');
    }
  });
});


app.post('/api/login', (req,res) =>{ 
    const {username, password} = req.body;
    const query = `SELECT * FROM users WHERE name = ? AND password = ?`;

    conn.query(query, [username, password], (err, results, fields) => {
      if (err) throw err;
  
      if (results.length === 0) {
        res.status(401).send('Invalid username or password');
        
      } 
      else {
        res.status(200).send('Login successful');
        
      }
    });
})


app.listen(port, () => {
    console.log(`Server listening on port http://localhost:${port}`);
});
