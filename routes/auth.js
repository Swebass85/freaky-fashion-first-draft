const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../database/freaky-fashion.db"));

// show login page
router.get("/login", (req, res) => {
  res.render("login");
});

// register user
router.post("/register", (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare(
      "INSERT INTO users (email, password) VALUES (?, ?)"
    ).run(email, hashedPassword);

    res.redirect("/login");
  } catch (err) {
    res.send("User already exists");
  }
});

// login user
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

  if (!user) return res.send("User not found");

  const valid = bcrypt.compareSync(password, user.password);

  if (!valid) return res.send("Wrong password");

  res.send("Logged in!");
});

module.exports = router;