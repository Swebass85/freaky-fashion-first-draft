var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware
app.use(logger('dev'));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.use(session({
  secret: 'freaky-fashion-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

// make login state available in all EJS files
app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session.userId;
  next();
});

// routes
app.use('/', indexRouter);

app.use('/users', usersRouter);

app.use('/', authRouter);

// catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  res.locals.message = err.message;

  res.locals.error = req.app.get('env') === 'development'
    ? err
    : {};

  res.status(err.status || 500);

  res.render('error');
});

module.exports = app;