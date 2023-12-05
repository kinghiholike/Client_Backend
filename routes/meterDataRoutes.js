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

//Router to get meter power

router.get('/meterPower', authenticateToken, (req, res) => {
  const { DRN } = req.tokenPayload;

  // Query the database to get the current state of the meter
  const selectQueryPower = 'SELECT voltage, current, frequency FROM MeteringPower WHERE DRN = ?';

  connection.query(selectQueryPower, [DRN], (errPower, resultsPower) => {
    if (errPower) {
      console.error('Error querying meter POWER from the database:', errPower);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (resultsPower.length === 0) {
      return res.status(404).json({ error: 'Meter not found in the database' });
    }

    // Query the database to get the current state of the meter signal
    const selectQuerySignal = 'SELECT signal_strength FROM MeterCellularNetworkProperties WHERE DRN = ?';

    connection.query(selectQuerySignal, [DRN], (errSignal, resultsSignal) => {
      if (errSignal) {
        console.error('Error querying meter signal from the database:', errSignal);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (resultsSignal.length === 0) {
        return res.status(404).json({ error: 'Meter not found in the database' });
      }

      // Query the database to get the current state of the meter signal and energy
      const selectQueryUnit_ActiveEnergy = 'SELECT active_energy, units FROM MeterCumulativeEnergyUsage WHERE DRN = ?';

      connection.query(selectQueryUnit_ActiveEnergy, [DRN], (errUnitActiveEnergy, resultsActiveEnergy) => {
        if (errUnitActiveEnergy) {
          console.error('Error querying meter signal from the database:', errUnitActiveEnergy);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (resultsActiveEnergy.length === 0) {
          return res.status(404).json({ error: 'Meter not found in the database' });
        }

        const meterPower = {
          voltage: resultsPower[0].voltage,
          current: resultsPower[0].current,
          frequency: resultsPower[0].frequency,
          signal_strength: resultsSignal[0].signal_strength,
          active_energy: resultsActiveEnergy[0].active_energy,
          units: resultsActiveEnergy[0].units
        };

        // Respond with the current state of the meter
        res.json(meterPower);
      });
    });
  });
});
   
  

  
module.exports = router;