const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/freaky-fashion.db");


router.get("/search", function (req, res, next) {
  const searchQuery = req.query.q;

  db.all(
    `
    SELECT *
    FROM products
    WHERE type LIKE ?
    OR brand LIKE ?
    `,
    [`%${searchQuery}%`, `%${searchQuery}%`],
    (err, products) => {
      if (err) {
        return next(err);
      }

      res.render("search-results", {
        title: "Search Results",
        products: products,
        searchQuery: searchQuery
      });
    }
  );
});

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

  // 1. Get the selected product
  db.get(
    `SELECT * FROM products WHERE id = ?`,
    [productId],
    (err, product) => {
      if (err) return next(err);

      if (!product) {
        return res.status(404).send("Product not found");
      }

      // 2. Get other products for carousel
      db.all(
        `
        SELECT *
        FROM products
        WHERE id != ?
        LIMIT 6
        `,
        [productId],
        (err, relatedProducts) => {
          if (err) return next(err);

          // 3. Render page with BOTH datasets
          res.render("products", {
            title: product.type,
            product: product,
            relatedProducts: relatedProducts
          });
        }
      );
    }
  );
});

module.exports = router;
