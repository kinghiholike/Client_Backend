const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require("../db");
const dotenv = require('dotenv');
const authenticateToken = require('../middleware/axtractMeterdrn');
// Configure dotenv
dotenv.config();





  //Router to update electricity oken
router.post('/update-token', authenticateToken, async (req, res) => {
    try {
      const { MeterDRN } = req.params;
      const { token_ID, user } = req.body;
  
      // Update the database with the new token, reason, and user
      const updateQuery = 'UPDATE SendSTSToken SET token_ID = ?, user = ? WHERE MeterDRN = ?';
      await connection.query(updateQuery, [token_ID,  user, MeterDRN]);
  
      res.status(200).json({ success: true, message: 'Token updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });



module.exports = router;
