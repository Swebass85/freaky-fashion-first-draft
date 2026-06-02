const express = require("express");
const router = express.Router();

module.exports = (db) => {

  router.get("/", (req, res) => {
    try {

      const users = db.prepare(`
        SELECT id,
        first_name,
        last_name,
        email,
        birthday,
        created_at
        FROM users
        ORDER BY created_at DESC
      `).all();

      res.render("users", {
        title: "Users",
        users
      });

    } catch (err) {
      console.error("Users route error:", err);
      res.status(500).send("Could not load users");
    }
  });

  return router;
};