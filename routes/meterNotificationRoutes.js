const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const NodeGeocoder = require('node-geocoder');
const authenticateToken = require('../middleware/axtractMeterdrn');
const request = require('request');
const config = process.env;

//DOTENV configuration
const dotenv = require('dotenv'); // Import dotenv
const connection = require("../db");
dotenv.config();
const environment = process.env;



// Route to set notifications for a meter based on the DRN
router.post('/setNotifications', authenticateToken, (req, res) => {
    const { DRN } = req.tokenPayload;
    const { Alarm, AlarmType, Urgency_Type } = req.body;
  
    // Check if required parameters are provided
    if (!Alarm || !AlarmType || !Urgency_Type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    // Insert or update the meter notifications in the database
    const upsertQuery = `
      INSERT INTO MeterNotifications (DRN, Alarm, AlarmType, Urgency_Type)
      VALUES (?, ?, ?, ?)
      
    `;
  
    connection.query(upsertQuery, [DRN, Alarm, AlarmType, Urgency_Type], (err) => {
      if (err) {
        console.error('Error setting meter notifications in the database:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      res.status(200).json({ message: 'Meter notifications set successfully' });
    });
  });
  
// Route to get the state of the meter based on the DRN from the token
router.get('/getNotifications', authenticateToken, (req, res) => {
  const { DRN } = req.tokenPayload;
  console.log(DRN);
  // Query the database to get the current state of the meter
  const selectQuery = 'SELECT Alarm, AlarmType, Urgency_Type FROM MeterNotifications WHERE DRN = ?';

  connection.query(selectQuery, [DRN], (err, results) => {
    if (err) {
      console.error('Error querying meter state from the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Meter not found in the database' });
    }

    // Extracting values from each row in the results
    const notifications = results.map(( {Alarm, AlarmType, Urgency_Type }) => ({
      Alarm,
      AlarmType,
      Urgency_Type,
    }));

    // Respond with an array of values
    res.json(
     notifications
    );
  });
});


module.exports = router;