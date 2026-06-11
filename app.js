const createError = require("http-errors");
const express = require("express");
const path = require("path");
const fs = require("fs");
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

/* DATABASE SETUP */
const dbPath = path.join(__dirname, "database", "freaky-fashion.db");
console.log("Using database:", dbPath);

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const schemaPath = path.join(__dirname, "database", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

const tables = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
  ORDER BY name
`).all();

console.log("Tables found:", tables);
/* END DATABASE SETUP */

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: "freaky-fashion-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use((req, res, next) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.locals.user = null;
      res.locals.isLoggedIn = false;
      res.locals.isAdmin = false;
      return next();
    }

    const user = db.prepare(`
      SELECT id, first_name, email, administrator
      FROM users
      WHERE id = ?
    `).get(userId);

    res.locals.user = user || null;
    res.locals.isLoggedIn = Boolean(user);
    res.locals.isAdmin = user
      ? Number(user.administrator) === 1
      : false;

    next();
  } catch (err) {
    console.error("User middleware error:", err);

    res.locals.user = null;
    res.locals.isLoggedIn = false;
    res.locals.isAdmin = false;

    next();
  }
});

app.use((req, res, next) => {
  try {
    const categories = db.prepare(`
      SELECT *
      FROM categories
      ORDER BY name
    `).all();

    res.locals.categories = categories;
  } catch (err) {
    console.error("Category middleware error:", err);
    res.locals.categories = [];
  }

  next();
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

  res.render("error", {
    message: err.message || "Something went wrong",
    error: app.get("env") === "development" ? err : {}
  });
});

module.exports = app;