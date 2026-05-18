var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const Database = require("better-sqlite3");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');

var app = express();

// DB
const db = new Database(path.join(__dirname, "./database/freaky-fashion.db"));
const requireAuth = require("./middleware/requireAuth");

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

// 🔥 TEST ROUTE (MUST BE AFTER app is created)
app.get("/test", (req, res) => {
  res.send("OK SERVER IS RUNNING");
});

// user middleware
app.use((req, res, next) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.locals.user = null;
      res.locals.isLoggedIn = false;
      return next();
    }

    const user = db
      .prepare("SELECT id, first_name, email FROM users WHERE id = ?")
      .get(userId);

    res.locals.user = user || null;
    res.locals.isLoggedIn = !!user;

    next();
  } catch (err) {
    console.error("User middleware error:", err);
    res.locals.user = null;
    res.locals.isLoggedIn = false;
    next();
  }
});

// routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', authRouter);

// 404
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);
  res.status(500).send(err.stack);
});

module.exports = app;