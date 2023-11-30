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



// Route to turn the meter on or off based on the DRN from the token
router.post('/turn-meter-on-off', authenticateToken, (req, res) => {
  const { DRN , FirstName:user} = req.tokenPayload;
  const { state, reason } = req.body;
  


  // Validate the request body
  if (state === undefined || (state !== "0" && state !== "1")) {
    return res.status(400).json({ error: 'Invalid state value. Use 0 for off or 1 for on.' });
  }

  // // Update the meter state based on the request
  // meterStatus[DRN] = state;

  // Update the MySQL database
  const updateQuery = 'UPDATE MeterMainsControlTable SET state = ?, reason = ?, user = ? WHERE DRN = ?';

  connection.query(updateQuery, [state, reason, user, DRN], (err, results) => {
    if (err) {
      console.error('Error updating meter state in the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Respond with the updated state
    res.json({  state });
  });
});

// Route to turn the heater on or off based on the heaterID from the token
router.post('/turn-heater-on-off', authenticateToken, (req, res) => {
  const { DRN, FirstName: user } = req.tokenPayload;
  const { state, reason } = req.body;

  // Validate the request body
  if (state === undefined || (state !== "0" && state !== "1")) {
    return res.status(400).json({ error: 'Invalid state value. Use 0 for off or 1 for on.' });
  }

  // // Update the heater state based on the request
  // heaterStatus[DRN] = state;

  // Update the MySQL database for the heater
const updateQuery = 'UPDATE MeterHeaterControlTable SET state = ?, reason = ?, user = ? WHERE DRN = ?';

connection.query(updateQuery, [state, reason, user, DRN], (err, results) => {
  if (err) {
    console.error('Error updating heater state in the database:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }


    // Respond with the updated state
    res.json({ state});
  });
});
// Route to get the state of the meter based on the DRN from the token
router.get('/get-meter-state', authenticateToken, (req, res) => {
  const { DRN } = req.tokenPayload;
  console.log(DRN);
  // Query the database to get the current state of the meter
  const selectQuery = 'SELECT state FROM MeterMainsStateTable WHERE DRN = ?';

  connection.query(selectQuery, [DRN], (err, results) => {
    if (err) {
      console.error('Error querying meter state from the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Meter not found in the database' });
    }

    const meterState = results[0].state;

    // Respond with the current state of the meter
    res.json( meterState);
  });
});

// Route to get the state of the heater based on the heaterID from the token
router.get('/get-heater-state', authenticateToken, (req, res) => {
  const { DRN } = req.tokenPayload;

  // Query the database to get the current state of the heater
  const selectQuery = 'SELECT state FROM MeterHeaterStateTable WHERE DRN = ?';

  connection.query(selectQuery, [DRN], (err, results) => {
    if (err) {
      console.error('Error querying heater state from the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Heater not found in the database' });
    }

    // Assuming the state is a boolean or an integer (1 or 0)
    const heaterState = results[0].state;

    // Respond with the current state of the heater as a numeric value (1 or 0)
    res.json(heaterState);
  });
});



module.exports = router;
