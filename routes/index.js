const express = require("express");
const router = express.Router();
const Fuse = require("fuse.js");

module.exports = (db) => {
  function requireAdmin(req, res, next) {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).send("Access denied");
  }

  next();
}
  router.get("/", (req, res, next) => {
    try {
      const userId = req.session.userId;
      let products;

      if (userId) {
        products = db.prepare(`
          SELECT products.*,
          julianday('now') - julianday(products.created_at) AS age_days,
          CASE WHEN favorites.id IS NOT NULL THEN 1 ELSE 0 END AS isFavorite
          FROM products
          LEFT JOIN favorites
          ON favorites.product_id = products.id
          AND favorites.user_id = ?
        `).all(userId);
      } else {
        products = db.prepare(`
          SELECT *,
          julianday('now') - julianday(created_at) AS age_days
          FROM products
        `).all();

        products = products.map(product => ({
          ...product,
          isFavorite: req.session.favorites?.includes(product.id) ? 1 : 0
        }));
      }

      res.render("index", {
        title: "Freaky Fashion",
        products
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/search", (req, res) => {
    try {
      const searchQuery = req.query.q || "";

      if (!searchQuery.trim()) {
        return res.json([]);
      }

      const products = db.prepare(`
        SELECT *,
        julianday('now') - julianday(created_at) AS age_days
        FROM products
      `).all();

      const fuse = new Fuse(products, {
        keys: ["type", "brand"],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: true
      });

      const results = fuse.search(searchQuery);
      res.json(results.map(result => result.item));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

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

      res.render("products", {
        title: product.type,
        product,
        relatedProducts
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/favorites/:id", (req, res, next) => {
    try {
      const productId = Number(req.params.id);
      const userId = req.session.userId;

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: "Invalid product id"
        });
      }

      if (!userId) {
        if (!req.session.favorites) {
          req.session.favorites = [];
        }

        const index = req.session.favorites.indexOf(productId);
        let isFavorite;

        if (index === -1) {
          req.session.favorites.push(productId);
          isFavorite = true;
        } else {
          req.session.favorites.splice(index, 1);
          isFavorite = false;
        }

        req.session.favoritesCount = req.session.favorites.length;

        return res.json({
          success: true,
          isFavorite,
          count: req.session.favoritesCount
        });
      }

      const existing = db.prepare(`
        SELECT id FROM favorites
        WHERE user_id = ? AND product_id = ?
      `).get(userId, productId);

      let isFavorite;

      if (existing) {
        db.prepare(`
          DELETE FROM favorites
          WHERE user_id = ? AND product_id = ?
        `).run(userId, productId);

        isFavorite = false;
      } else {
        db.prepare(`
          INSERT OR IGNORE INTO favorites (user_id, product_id)
          VALUES (?, ?)
        `).run(userId, productId);

        isFavorite = true;
      }

      const count = db.prepare(`
        SELECT COUNT(*) AS count
        FROM favorites
        WHERE user_id = ?
      `).get(userId).count;

      req.session.favoritesCount = count;

      res.json({
        success: true,
        isFavorite,
        count
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/favorites", (req, res, next) => {
    try {
      const userId = req.session.userId;

      if (userId) {
        const products = db.prepare(`
          SELECT products.*,
          julianday('now') - julianday(products.created_at) AS age_days
          FROM favorites
          JOIN products ON products.id = favorites.product_id
          WHERE favorites.user_id = ?
        `).all(userId);

        return res.render("favorites", {
          title: "Mina favoriter",
          products
        });
      }

      const favoriteIds = req.session.favorites || [];

      if (favoriteIds.length === 0) {
        return res.render("favorites", {
          title: "Mina favoriter",
          products: []
        });
      }

      const placeholders = favoriteIds.map(() => "?").join(",");

      const products = db.prepare(`
        SELECT *,
        julianday('now') - julianday(created_at) AS age_days
        FROM products
        WHERE id IN (${placeholders})
      `).all(...favoriteIds);

      res.render("favorites", {
        title: "Mina favoriter",
        products
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/news", (req, res, next) => {
  try {
    const products = db.prepare(`
      SELECT *,
      julianday('now') - julianday(created_at) AS age_days
      FROM products
      WHERE julianday('now') - julianday(created_at) <= 7
    `).all();

    res.render("news", {
      title: "Nyheter",
      products
    });
  } catch (err) {
    next(err);
  }
});

router.get("/administration", requireAdmin, (req, res, next) => {
  try {
    const products = db.prepare(`
      SELECT *
      FROM products
      ORDER BY id DESC
    `).all();

    res.render("administration", {
      title: "Administration",
      products
    });
  } catch (err) {
    next(err);
  }
});

  return router;

    return router;
};