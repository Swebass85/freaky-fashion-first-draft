
console.log("ROUTE / HIT");
const express = require("express");
const router = express.Router();
const Database = require("better-sqlite3");
const path = require("path");

// IMPORTANT: use absolute path (prevents silent DB fail)
const db = new Database(
  path.join(__dirname, "../database/freaky-fashion.db")
);

/* -------------------------
   HOME PAGE
--------------------------*/
router.get("/", (req, res, next) => {
  try {
    const products = db.prepare(`
      SELECT *,
      julianday('now') - julianday(created_at) AS age_days
      FROM products
    `).all();

    console.log("HOME ROUTE HIT - products:", products.length);

    return res.render("index", {
      title: "Freaky Fashion",
      products,
    });

  } catch (err) {
    console.error("HOME ERROR:", err);
    return next(err);
  }
});

/* -------------------------
   SEARCH
--------------------------*/
router.get("/search", (req, res, next) => {
  try {
    const searchQuery = req.query.q || "";

    const products = db.prepare(`
      SELECT *
      FROM products
      WHERE type LIKE ? OR brand LIKE ?
    `).all(`%${searchQuery}%`, `%${searchQuery}%`);

    return res.render("search-results", {
      title: "Search Results",
      products,
      searchQuery,
    });

  } catch (err) {
    return next(err);
  }
});

/* -------------------------
   PRODUCT PAGE
--------------------------*/
router.get("/products/:id", (req, res, next) => {
  try {
    const productId = req.params.id;

    const product = db.prepare(`
      SELECT * FROM products WHERE id = ?
    `).get(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const relatedProducts = db.prepare(`
      SELECT *
      FROM products
      WHERE id != ?
      LIMIT 6
    `).all(productId);

    return res.render("products", {
      title: product.type,
      product,
      relatedProducts,
    });

  } catch (err) {
    return next(err);
  }
});

module.exports = router;