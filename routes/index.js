const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/freaky-fashion.db");

/* GET home page. */
router.get("/", function (req, res, next) {
  db.all(
    `
    SELECT *,
    julianday('now') - julianday(created_at) AS age_days
    FROM products
    `,
    [],
    (err, products) => {
      if (err) {
        return next(err);
      }

      res.render("index", {
        title: "Freaky Fashion",
        products: products,
      });
    },
  );
});

router.get("/products/:id", function (req, res, next) {
  const productId = req.params.id;

  db.get(
    `
    SELECT *
    FROM products
    WHERE id = ?
    `,
    [productId],
    (err, product) => {
      if (err) {
        return next(err);
      }

      if (!product) {
        return res.status(404).send("Product not found");
      }

      res.render("product", {
        title: product.type,
        product: product,
      });
    },
  );
});

module.exports = router;
