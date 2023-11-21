// powerOffAndOnRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require("../db");
const dotenv = require('dotenv');

// Configure dotenv
dotenv.config();
const environment = process.env;
// Mocked data for demonstration purposes
let meterStatus = {
  MeterDRN: 1, // 1 for on, 0 for off
  MeterDRN: 0,
};

let heaterStatus = {
  MeterDRN: 1, // 1 for on, 0 for off
  MeterDRN: 0,
  };
  
// Middleware to verify the token and extract MeterDRN
function authenticateToken(req, res, next) {
  // Get the token from the request header
  const token = req.header('Authorization');

  // Check if the token is present
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token not provided' });
  }

  // Verify the token
  jwt.verify(token, environment.SECRET_KEY, (err, tokenPayload) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }

    // Extract MeterDRN from the token payload
    const { MeterDRN } = tokenPayload;
    console.log(MeterDRN);

    // Attach the MeterDRN to the request object for later use
    req.tokenPayload = { MeterDRN };
    

    // Move to the next middleware or route handler
    next();
  });
}

// Route to turn the meter on or off based on the MeterDRN from the token
router.post('/turn-meter-on-off', authenticateToken, (req, res) => {
  const { MeterDRN } = req.tokenPayload;
  console.log(MeterDRN);

  // Validate the request body
  const { state } = req.body;
  if (state === undefined || (state !== 0 && state !== 1)) {
    return res.state(400).json({ error: 'Invalid state value. Use 0 for off or 1 for on.' });
  }

  // Update the meter state based on the request
  meterStatus[MeterDRN] = state;

  // Respond with the updated state
  res.json({ MeterDRN, state: meterStatus[MeterDRN] });
});

// Route to turn the heater on or off based on the heaterID from the token
router.post('/turn-heater-on-off', authenticateToken, (req, res) => {
    const { MeterDRN } = req.tokenPayload;
    console.log(MeterDRN);
  
    // Validate the request body
    const { state } = req.body;
    if (state === undefined || (state !== 0 && state !== 1)) {
      return res.state(400).json({ error: 'Invalid state value. Use 0 for off or 1 for on.' });
    }
  
    // Update the heater state based on the request
    heaterStatus[MeterDRN] = state;
  
    // Respond with the updated state
    res.json({ MeterDRN, state: heaterStatus[MeterDRN] });
  });
module.exports = router;
