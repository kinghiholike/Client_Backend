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
  meterDRN1: 1, // 1 for on, 0 for off
  meterDRN2: 0,
};

let heaterStatus = {
    meterDRN1: 1, // 1 for on, 0 for off
    meterDRN2: 0,
  };
  
// Middleware to verify the token and extract meterDRN
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

    // Extract meterDRN from the token payload
    const { meterDRN } = tokenPayload;

    // Attach the meterDRN to the request object for later use
    req.tokenPayload = { meterDRN };

    // Move to the next middleware or route handler
    next();
  });
}

// Route to turn the meter on or off based on the meterDRN from the token
router.post('/turn-meter-on-off', authenticateToken, (req, res) => {
  const { meterDRN } = req.tokenPayload;

  // Validate the request body
  const { status } = req.body;
  if (status === undefined || (status !== 0 && status !== 1)) {
    return res.status(400).json({ error: 'Invalid status value. Use 0 for off or 1 for on.' });
  }

  // Update the meter status based on the request
  meterStatus[meterDRN] = status;

  // Respond with the updated status
  res.json({ meterDRN, status: meterStatus[meterDRN] });
});

// Route to turn the heater on or off based on the heaterID from the token
router.post('/turn-heater-on-off', authenticateToken, (req, res) => {
    const { meterDRN } = req.tokenPayload;
  
    // Validate the request body
    const { status } = req.body;
    if (status === undefined || (status !== 0 && status !== 1)) {
      return res.status(400).json({ error: 'Invalid status value. Use 0 for off or 1 for on.' });
    }
  
    // Update the heater status based on the request
    heaterStatus[meterDRN] = status;
  
    // Respond with the updated status
    res.json({ meterDRN, status: heaterStatus[meterDRN] });
  });
module.exports = router;
