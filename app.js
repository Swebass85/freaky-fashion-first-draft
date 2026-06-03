const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const Database = require("better-sqlite3");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const checkoutRouter = require("./routes/checkout");
const administrationRouter = require("./routes/administration");

const app = express();

const db = new Database(path.join(__dirname, "./database/freaky-fashion.db"));
db.pragma("foreign_keys = ON");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: "freaky-fashion-secret",
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.locals.user = null;
      res.locals.isLoggedIn = false;
      return next();
    }

    const user = db
      .prepare("SELECT id, first_name, email, administrator FROM users WHERE id = ?")
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

app.use("/", indexRouter(db));
app.use("/users", usersRouter(db));
app.use("/", authRouter(db));
app.use("/", checkoutRouter(db));
app.use("/", administrationRouter(db));

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);
  res.status(err.status || 500);
  res.send(err.stack);
});

module.exports = app;