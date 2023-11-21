var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const NodeGeocoder = require('node-geocoder');

const config = process.env;

const validator = require('validator');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv'); // Import dotenv
const connection = require("../db");
const e = require('cors');
const { cookie } = require('request');
router.use(cookieParser());

dotenv.config();



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
  const { Username, Password, FirstName, MeterDRN, LastName, Email, IsActive, RoleName } = req.body;

  // Validate inputs
  if (!Username || !Password || !FirstName || !MeterDRN || !LastName || !Email || !IsActive || !RoleName || !validateEmail(Email)) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    console.log('Received registration request with data:');
    console.log('Request Body:', req.body);

    const hashedPassword = await bcrypt.hash(Password, 10);

    connection.query(
      'INSERT INTO users (Username, Password, FirstName, MeterDRN, LastName, Email, IsActive, RoleName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [Username, hashedPassword, FirstName, MeterDRN, LastName, Email, IsActive, RoleName],
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
  const findUserQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(findUserQuery, [Email], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      console.log(err);
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

      // Set user data in the session
      req.session.user = {
        UserID: user.UserID,
        Email: user.Email,
        AccessLevel: user.AccessLevel,
      };

      // Generate a JWT with user's AccessLevel and other user data
      const token = jwt.sign(
        {
          UserID: user.UserID,
          Email: user.Email,
          AccessLevel: user.AccessLevel,
          // Include other user data as needed
        },
        process.env.SECRET_KEY,
        { expiresIn: '30m' }
      );

      // Getting the user profile based on MeterDRN
const findUserQuery = 'SELECT Lat, Longitude FROM MeterLocationInfoTable WHERE DRN = ?';

connection.query(findUserQuery, [user.MeterDRN], (error, results) => {
  if (error) {
    return res.status(500).json({ error: 'Database query failed', details: error });
  }

  if (results.length === 0) {
    return res.status(404).json({ error: 'User not found', details: 'The user with the provided MeterDRN is not found.' });
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
      const userData = {
        MeterDRN: user.MeterDRN,
        UserID: user.UserID,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email,
        streetName,
        cityName,
        countryName,
      };

      // Generate a JWT with user's AccessLevel
      const token = jwt.sign(
        {
          UserID: user.UserID,
          Email: user.Email,
          AccessLevel: user.AccessLevel,
          FirstName: user.FirstName,
          LastName: user.LastName,
          addressComponents
        },
        process.env.SECRET_KEY,
        { expiresIn: '30m' }
      );

      // Set the token in a cookie
      res.cookie('Athorisationfrombackend=', token, {
        httpOnly: false,
        credentials: 'include',
        maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds
      });

      // Send the response with both token and userData
      res.status(200).json({
        message: 'User profile pulled successfully',
        userData,
        redirect: (`/protected?token=${encodeURIComponent(token)}`)
        
      });
    })
    .catch((geocodingError) => {
      console.error('Error fetching location:', geocodingError);
      res.status(500).json({ error: 'Error fetching location', details: geocodingError.message });
    });
});

    });
  });
});

// The /protected route remains the same as before
router.get('/protected', authenticateToken, (req, res) => {
  // Access user data from req.user
  const userData = req.user;

  res.json({ message: 'Protected resource accessed', userData });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = req.query.token || (authHeader && authHeader.split(' ')[1]);

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;

    next();
  });
}


//Router to get user data 

router.get('/getUser/:UserID', (req, res) => {
  const { UserID } = req.params;
  console.log('UserID:', UserID);

  // Find the user by UserID
  const findUser = 'SELECT * FROM users WHERE UserID = ?';
  connection.query(findUser, [UserID], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database query failed', details: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found', details: 'The user with the provided email is not found.' });
    }

    // Omitting sensitive information like passwords before sending the response
    const user = {
      MeterDRN: user.MeterDRN,
      UserID: user.UserID,
      FirstName: user.FirstName,
      LastName: user.LastName,
      Email: user.Email,
    };

    res.status(200).json({ message: 'User profile retrieved successfully', user ,
    redirect: `/protected?token=${encodeURIComponent(token)}`
  });
  });
});
module.exports = router;
