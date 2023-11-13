var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// const corsOptions = require('cors');

var app = express();



app.use(cors({
origin: '*', 
credentials: true,
optionSuccessStatus: 200,}
  
));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secret',
  resave:false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    maxAge:1000 * 60 * 60 *  24
  }

}))

app.use('/', indexRouter);
app.use('/', usersRouter);




app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index');
});


const db = require('./db'); // Import the database connection from db.js

db.connect((err) => {
  if (err) {
    console.log("Failed to connect to AWS RDS:", err.message);
    return;
  }
  console.log("Successfully connected to AWS RDS database");
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
  });
});

module.exports = app;
