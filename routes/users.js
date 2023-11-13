var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const config = process.env;
const enviroment = process.env;
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv'); // Import dotenv
const connection = require("../db");
router.use(cookieParser());
router.use(
  session({
    secret: enviroment.SECRET_KEY, 
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false ,
      maxAge: 30 * 60 * 1000}, 
  })
)

dotenv.config();



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
// Sign-Up route
router.post('/signup', async (req, res) => {
  const { Username, Password, FirstName, LastName, Email, IsActive, RoleName } = req.body;

  // Validate inputs
  if (!Username || !Password || !FirstName || !LastName || !Email || !IsActive || !RoleName || !validateEmail(Email)) {
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
          return res.json(500).json({ error: 'Registration failed', err });
        }
        console.log('Registration successful');

        // Define the 'title' variable for the template
        // const title = 'Signup Page';

        // // Pass 'title' to the template
        // res.render('your_template', { title: title });
      }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed', err });
  }
});

const validateEmail = (Email) => {
  if (!validator.isEmail(Email)) {
    return false;
  }
  return true;
};


// Sign-In route
router.post('/signin', (req, res) => {
  const { Email, Password } = req.body;

  // Find the user by email
  const findUserQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(findUserQuery, [Email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query failed', err });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Authentication failed', err });
    }

    // Compare passwords
    const user = results[0];

    bcrypt.compare(Password, user.Password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Password comparison failed', err });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Authentication failed', err });
      }

      // Set user data in the session
      req.session.user = {
        UserID: user.UserID,
        email: user.email,
        AccessLevel: user.AccessLevel,
      };

      // Generate a JWT with user's AccessLevel
      const token = jwt.sign(
        { UserID: user.UserID, email: user.email, AccessLevel: user.AccessLevel },
        'your-secret-key', // Change this to your JWT secret key
        { expiresIn: '30m' }
      );

      // Set the cookie
      res.cookie('token', token, { httpOnly: true ,sameSite: 'Lax', secure: false});

      // Send a JSON response
      res.status(200).json({
        message: 'Login successful, redirecting...',
        token,
        redirectTo: '/dash.html',
      });
    });
  });
});

module.exports = router;
