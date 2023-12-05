var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const cors = require('cors');
const request = require('request');
const dotenv = require('dotenv'); // Import dotenv
const app = express();
dotenv.config();
const environment = process.env;
// CORS configuration
const corsOptions = {
  origin: 'http://gridxmeter.com', 
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(
  session({
    secret: environment.SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 30 * 60 * 1000 },
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index');
});

// Your other route setups
app.use('/', require('./routes/index'));
app.use('/', require('./routes/users'));
app.use('/', require('./routes/forgotPasswordRoutes'));
app.use('/', require('./routes/powerOffAndOnRoutes'));
app.use('/', require('./routes/meterTokenRoutes'));
app.use('/', require('./routes/meterDataRoutes'));
app.use('/',require('./routes/meterNotificationRoutes'));

const db = require('./db');

db.connect((err) => {
  if (err) {
    console.log("Failed to connect to AWS RDS:", err.message);
    return;
  }
  console.log("Successfully connected to AWS RDS database");
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

module.exports = app;
