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
      ON DUPLICATE KEY UPDATE Alarm = VALUES(Alarm), AlarmType = VALUES(AlarmType), Urgency_Type = VALUES(Urgency_Type)
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
  
      // object containing the meter notifications
    const meterNotification = {
        Alarm: results[0].Alarm,
        AlarmType: results[0].AlarmType,
        Urgency_Type: results[0].Urgency_Type,
      };
  
      // Respond with the current state of the meter
      res.json( meterNotification);
    });
  });

module.exports = router;