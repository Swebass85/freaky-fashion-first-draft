const express = require("express");
const router = express.Router();
const Fuse = require("fuse.js");
const multer = require("multer");
const path = require("path");

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "images", "categories"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  }
});

const uploadCategory = multer({ storage: categoryStorage });

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
          CASE WHEN favorites.product_id IS NOT NULL THEN 1 ELSE 0 END AS isFavorite
          FROM products
          LEFT JOIN favorites
            ON favorites.product_id = products.id
            AND favorites.user_id = ?
          WHERE datetime(products.created_at) <= datetime('now')
          ORDER BY products.created_at DESC
        `).all(userId);
      } else {
        products = db.prepare(`
          SELECT *,
          julianday('now') - julianday(created_at) AS age_days
          FROM products
          WHERE datetime(created_at) <= datetime('now')
          ORDER BY created_at DESC
        `).all();

        products = products.map((product) => ({
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
        WHERE datetime(created_at) <= datetime('now')
      `).all();

      const fuse = new Fuse(products, {
        keys: ["type", "brand"],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: true
      });

      const results = fuse.search(searchQuery);

      res.json(results.map((result) => result.item));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/categories/:slug", (req, res, next) => {
  try {
    const category = db.prepare(`
      SELECT *
      FROM categories
      WHERE slug = ?
    `).get(req.params.slug);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    const products = db.prepare(`
      SELECT *,
      julianday('now') - julianday(created_at) AS age_days
      FROM products
      WHERE category_id = ?
      AND datetime(created_at) <= datetime('now')
      ORDER BY created_at DESC
    `).all(category.id);

    res.render("category", {
      title: category.name,
      category,
      products
    });
  } catch (err) {
    next(err);
  }
});

  router.get("/products/:slug", (req, res, next) => {
  try {
    const productSlug = req.params.slug;

    const product = db.prepare(`
      SELECT *,
      julianday('now') - julianday(created_at) AS age_days
      FROM products
      WHERE slug = ?
      AND datetime(created_at) <= datetime('now')
    `).get(productSlug);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const relatedProducts = db.prepare(`
      SELECT *
      FROM products
      WHERE id != ?
      AND datetime(created_at) <= datetime('now')
      LIMIT 6
    `).all(product.id);

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
        SELECT id
        FROM favorites
        WHERE user_id = ?
        AND product_id = ?
      `).get(userId, productId);

      let isFavorite;

      if (existing) {
        db.prepare(`
          DELETE FROM favorites
          WHERE user_id = ?
          AND product_id = ?
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
          AND datetime(products.created_at) <= datetime('now')
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
        AND datetime(created_at) <= datetime('now')
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
        WHERE datetime(created_at) <= datetime('now')
        AND julianday('now') - julianday(created_at) <= 7
        ORDER BY created_at DESC
      `).all();

      res.render("news", {
        title: "Nyheter",
        products
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/admin/categories", requireAdmin, (req, res, next) => {
    try {
      const categories = db.prepare(`
        SELECT *
        FROM categories
        ORDER BY id DESC
      `).all();

      res.render("admin/categories", {
        title: "Kategorier",
        categories
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/admin/categories/new", requireAdmin, (req, res) => {
    res.render("admin/edit-category", {
      title: "Lägg till kategori"
    });
  });

  router.post(
    "/admin/categories/new",
    requireAdmin,
    uploadCategory.single("image"),
    (req, res, next) => {
      try {
        const { name } = req.body;

        const slug = name
          .toLowerCase()
          .trim()
          .replaceAll("å", "a")
          .replaceAll("ä", "a")
          .replaceAll("ö", "o")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const image = req.file
          ? `/images/categories/${req.file.filename}`
          : null;

        db.prepare(`
          INSERT INTO categories (name, slug, image)
          VALUES (?, ?, ?)
        `).run(name, slug, image);

        res.redirect("/admin/categories");
      } catch (err) {
        next(err);
      }
    }
  );

  router.post("/admin/categories/:id/delete", requireAdmin, (req, res, next) => {
    try {
      db.prepare(`
        DELETE FROM categories
        WHERE id = ?
      `).run(req.params.id);

      res.redirect("/admin/categories");
    } catch (err) {
      next(err);
    }
  });

  return router;
};