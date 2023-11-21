var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const enviroment = process.env;
const cors = require('cors');
const rateLimit = require('express-rate-limit');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const powerOffAndOnRoutes = require('./routes/powerOffAndOnRoutes');
// const corsOptions = require('cors');
//Rate limiter 
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many requests, please try again later.',
});

var app = express();



app.use(cors({
origin: ['http://localhost:3000','http://gridxmeter.com/'], 
credentials: true,
optionSuccessStatus: 200,}
  
));
app.use(
  session({
    secret: enviroment.SECRET_KEY, 
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false ,
      maxAge: 2 * 60 * 1000}, 
  })
)

app.use(logger('dev'));
app.use(express.json());
app.use(limiter);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));







app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/', forgotPasswordRoutes);
app.use('/', powerOffAndOnRoutes);


const db = require('./db'); // Import the database connection from db.js

db.connect((err) => {
  if (err) {
    console.log("Failed to connect to AWS RDS:", err.message);
    return;
  }
  console.log("Successfully connected to AWS RDS database");
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
  });
});

module.exports = app;
