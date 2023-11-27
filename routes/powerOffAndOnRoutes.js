// powerOffAndOnRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require("../db");
const authenticateToken = require('../middleware/axtractMeterdrn');
const dotenv = require('dotenv');

// Configure dotenv
dotenv.config();
const environment = process.env;



// Route to turn the meter on or off based on the MeterDRN from the token
router.post('/turn-meter-on-off', authenticateToken, (req, res) => {
  const { MeterDRN } = req.tokenPayload;
  const { state, reason, user } = req.body;

  // Validate the request body
  if (state === undefined || (state !== 0 && state !== 1)) {
    return res.status(400).json({ error: 'Invalid state value. Use 0 for off or 1 for on.' });
  }

  // // Update the meter state based on the request
  // meterStatus[MeterDRN] = state;

  // Update the MySQL database
  const updateQuery = 'UPDATE MeterMainsControlTable SET state = ?, reason = ?, user = ? WHERE MeterDRN = ?';

  connection.query(updateQuery, [state, reason, user, MeterDRN], (err, results) => {
    if (err) {
      console.error('Error updating meter state in the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Respond with the updated state
    res.json({ MeterDRN, state });
  });
});

// Route to turn the heater on or off based on the heaterID from the token
router.post('/turn-heater-on-off', authenticateToken, (req, res) => {
  const { MeterDRN } = req.tokenPayload;
  const { state, reason, user } = req.body;

  // Validate the request body
  if (state === undefined || (state !== 0 && state !== 1)) {
    return res.status(400).json({ error: 'Invalid state value. Use 0 for off or 1 for on.' });
  }

  // // Update the heater state based on the request
  // heaterStatus[MeterDRN] = state;

  // Update the MySQL database
  const updateQuery = 'UPDATE MeterHeaterControlTable SET state = ?, reason = ?, user = ? WHERE MeterDRN = ?';

  connection.query(updateQuery, [state, reason, user, MeterDRN], (err, results) => {
    if (err) {
      console.error('Error updating heater state in the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Respond with the updated state
    res.json({ MeterDRN, state});
  });
});
// Route to get the state of the meter based on the MeterDRN from the token
router.get('/get-meter-state', authenticateToken, (req, res) => {
  const { MeterDRN } = req.tokenPayload;
  console.log(MeterDRN);
  // Query the database to get the current state of the meter
  const selectQuery = 'SELECT state FROM MeterMainsStateTable WHERE MeterDRN = ?';

  connection.query(selectQuery, [MeterDRN], (err, results) => {
    if (err) {
      console.error('Error querying meter state from the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Meter not found in the database' });
    }

    const meterState = results[0].state;

    // Respond with the current state of the meter
    res.json({ MeterDRN, state: meterState });
  });
});

// Route to get the state of the heater based on the heaterID from the token
router.get('/get-heater-state', authenticateToken, (req, res) => {
  const { MeterDRN } = req.tokenPayload;
  
  // Query the database to get the current state of the heater
  const selectQuery = 'SELECT state FROM MeterHeaterStateTable WHERE MeterDRN = ?';

  connection.query(selectQuery, [MeterDRN], (err, results) => {
    if (err) {
      console.error('Error querying heater state from the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Heater not found in the database' });
    }

    const heaterState = results[0].state;

    // Respond with the current state of the heater
    res.json({ MeterDRN, state: heaterState });
  });
});


module.exports = router;
