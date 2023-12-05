const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const session = require('express-session');
const NodeGeocoder = require('node-geocoder');
const authenticateToken = require('../middleware/axtractMeterdrn');
const request = require('request');

const config = process.env;

const validator = require('validator');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv'); // Import dotenv
const connection = require("../db");
const e = require('cors');
const { cookie } = require('request');

dotenv.config();
const environment = process.env;


//eMAIL VALIDATION MIDDLEWARE
const validateEmail = (Email) => {
  if (!validator.isEmail(Email)) {
    return false;
  }
  return true;
};


//oPTIONS
const options = {
  provider: 'google',

  // Optional depending on the providers
  // fetch: customFetchImplementation,
  //AIzaSyA1b-nVLFTCT4rxGdj5HdTZ3ULOYBYosAM
  apiKey: 'AIzaSyA1b-nVLFTCT4rxGdj5HdTZ3ULOYBYosAM',
  //AIzaSyAqaUc4pBP_ZfHAgN8dHk8TS_5NM8otvPg // for Mapquest, OpenCage, Google Premier
  formatter: null // 'gpx', 'string', ...
};
//geocoder
const geocoder = NodeGeocoder(options);

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});





// Sign-Up route
router.post('/signup', async (req, res) => {
  const { Password, FirstName, DRN, LastName, Email } = req.body;

  // Validate inputs
  if (!Username || !Password || !FirstName || !DRN || !LastName || !Email || !IsActive || !RoleName || !validateEmail(Email)) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    console.log('Received registration request with data:');
    console.log('Request Body:', req.body);

    const hashedPassword = await bcrypt.hash(Password, 10);

    connection.query(
      'INSERT INTO SystemUsers (Username, Password, FirstName, DRN, LastName, Email, IsActive, RoleName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [Username, hashedPassword, FirstName, DRN, LastName, Email, IsActive, RoleName],
      (err, result) => {
        if (err) {
          console.error('Registration error:', err);
          return res.status(500).json({ error: 'Registration failed', err });
        }

        console.log('Registration successful');
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed', error });
  }
});


// Sign-In route
router.post('/signin', (req, res) => {
  const { Email, Password } = req.body;
  console.log(Email, Password);

  // Find the user by Email
  const findUserQuery = 'SELECT * FROM SystemUsers WHERE email = ?';
  connection.query(findUserQuery, [Email], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database query failed', details: err });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Authentication failed', details: 'User does not exist.' });
    }

    // Compare passwords
    const user = results[0];

    bcrypt.compare(Password, user.Password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Password comparison failed', details: err });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Authentication failed', details: 'Incorrect password.' });
      }

      // Generate a JWT with user's AccessLevel
      const token = jwt.sign(
        {
          UserID: user.UserID,
          DRN: user.DRN,
          Email: user.Email,
          FirstName: user.FirstName,
          LastName: user.LastName,
        },
        environment.SECRET_KEY,
        { expiresIn: '1h' } // Adjust the expiration time as needed
      );

      // Set the cookies for cross-origin requests
      res.cookie('cookie', 'token', { domain: 'gridxmeter.com' });
      res.cookie('accessToken', token, {
        httpOnly: false,
        maxAge: 40 * 60 * 1000,
        domain: 'gridxmeter.com',
        path: '/',
        sameSite: 'None', 
      });

      // Set CORS headers
      res.header('Access-Control-Allow-Origin', 'https://gridxmeter.com'); 
      res.header('Access-Control-Allow-Credentials', true);

      // Send the response with both token and user data
      res.status(200).json({
        message: 'User signed in successfully',
        token,
        redirect: (`/protected?token=${encodeURIComponent(token)}`)
      });
    });
  });
});

// The /protected route remains the same as before
router.get('/protected', authenticatetoken, (req, res) => {
  
  

  res.json({ message: 'Protected resource accessed' });
});

function authenticatetoken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = req.query.token || (authHeader && authHeader.split(' ')[1]);

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, environment.SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;

    next();
  });
}


// Get user information based on DRN route
router.get('/userData',authenticateToken, (req, res) => {
  const { DRN,UserID,FirstName,LastName,Email } = req.tokenPayload;

  // Getting the user profile based on DRN
  const findUserQuery = 'SELECT Lat, Longitude FROM MeterLocationInfoTable WHERE DRN = ?';

  connection.query(findUserQuery, [DRN], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Database query failed', details: error });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found', details: 'The user with the provided DRN is not found.' });
    }

    const userLocation = results[0];
    const latitude = userLocation.Lat;
    const longitude = userLocation.Longitude;

    // Perform reverse geocoding to get location information
    geocoder.reverse({ lat: latitude, lon: longitude })
      .then((geocodingRes) => {
        const formattedAddress = geocodingRes[0].formattedAddress;

        // components from the formatted address
        const addressComponents = formattedAddress.split(', ');

        // format of data
        const [streetName, cityName, countryName] = addressComponents;

        // additional user information in the response
        // const userData = {
        //   UserID: UserID,
        //   FirstName: FirstName,
        //   LastName: LastName,
        //   DRN: DRN,
        //   Email: Email,
        //   streetName,
        //   cityName,
        //   countryName,
        // };

        // Send the response with user data
        res.status(200).json({
          UserID: UserID,
          FirstName: FirstName,
          LastName: LastName,
          DRN: DRN,
          Email: Email,
          streetName,
          cityName,
          countryName,
         
        });
      })
      .catch((geocodingError) => {
        console.error('Error fetching location:', geocodingError);
        res.status(500).json({ error: 'Error fetching location', details: geocodingError.message });
      });
  });
});

// Sign-Out route
router.post('/signout', (req, res) => {
  // Clear the 'accessToken' cookie
  res.clearCookie('accessToken');

  

  // Send a response indicating successful sign-out
  res.status(200).json({ message: 'User signed out successfully' });
});


module.exports = router;
