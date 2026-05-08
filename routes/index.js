const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/freaky-fashion.db");

/* GET home page. */
router.get("/", function (req, res, next) {
  db.all("SELECT * FROM products", [], (err, products) => {
    if (err) {
      return next(err);
    }

    res.render("index", {
      title: "Freaky Fashion",
      products: products,
    });
  });
});

module.exports = router;
