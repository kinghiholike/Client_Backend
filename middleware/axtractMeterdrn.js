const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require("../db");
const dotenv = require('dotenv');

// Configure dotenv
dotenv.config();
const environment = process.env;

  
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
    const { DRN , FirstName, LastName, Email, UserID} = tokenPayload;

    console.log(DRN,FirstName,UserID);

    // Attach the DRN to the request object for later use
    req.tokenPayload = { DRN ,FirstName, LastName, Email, UserID};
    

    // Move to the next middleware or route handler
    next();
  });
}


module.exports = authenticateToken;