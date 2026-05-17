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
  const { first_name, last_name, email, password, birthday } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare(`
      INSERT INTO users (first_name, last_name, email, password, birthday)
      VALUES (?, ?, ?, ?, ?)
    `).run(first_name, last_name, email, hashedPassword, birthday || null);

    res.redirect("/login");
  } catch (err) {
    console.log(err);
    res.send("User already exists or invalid data");
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

  if (!user) {
    return res.send("User not found");
  }

  const valid = bcrypt.compareSync(password, user.password);

  if (!valid) {
    return res.send("Wrong password");
  }

  // save session
  req.session.userId = user.id;
  req.session.userEmail = user.email;

  // redirect after login
  res.redirect("/");
});

module.exports = router;