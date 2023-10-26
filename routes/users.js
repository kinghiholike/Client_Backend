var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
dotenv.config();
const config = process.env;
const enviroment = process.env;
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv'); // Import dotenv
const connection = require("../db");



// Sign-Up route
router.post('/signup', async (req, res) => {
  const { Username, Password, FirstName, LastName, Email, IsActive, RoleName } = req.body;

  // Validate inputs
  if (!Username || !Password || !FirstName || !LastName || !Email || !IsActive || !RoleName ||  !validateEmail(Email)) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    console.log('Received registration request with data:');
    console.log('Request Body:', req.body);

    const hashedPassword = await bcrypt.hash(Password, 10);

    connection.query(
      'INSERT INTO users (Username, Password, FirstName, LastName, Email, IsActive, RoleName) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Username, hashedPassword, FirstName, LastName, Email, IsActive, RoleName],
      (err, result) => {
        if (err) {
          console.error('Registration error:', err);
          return res.status(500).json({ error: 'Registration failed', err });
        }
        console.log('Registration successful');
        res.status(201).json({ message: 'Registration successful' });
      }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed', err });
  }
});
module.exports = router;
