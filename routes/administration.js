const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/products");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = (db) => {
  function requireAdmin(req, res, next) {
    if (!req.session.userId || !req.session.isAdmin) {
      return res.status(403).send("Access denied");
    }

    next();
  }

  router.get("/admin/products", requireAdmin, (req, res, next) => {
    try {
      const products = db.prepare(`
        SELECT products.*,
               categories.name AS category_name
        FROM products
        LEFT JOIN categories ON categories.id = products.category_id
        ORDER BY products.id DESC
      `).all();

      res.render("admin/administration", {
        title: "Administration",
        products
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/admin/products/new", requireAdmin, (req, res, next) => {
    try {
      const categories = db.prepare(`
        SELECT *
        FROM categories
        ORDER BY name
      `).all();

      res.render("admin/edit-product", {
        title: "Lägg till produkt",
        product: {
          id: null,
          type: "",
          description: "",
          brand: "",
          sku: "",
          price: "",
          picture_front: "",
          picture_back: "",
          created_at: "",
          category_id: ""
        },
        categories,
        isNew: true
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/admin/products/new",
    requireAdmin,
    upload.fields([
      { name: "picture_front", maxCount: 1 },
      { name: "picture_back", maxCount: 1 }
    ]),
    (req, res, next) => {
      try {
        const {
          type,
          description,
          brand,
          sku_letters,
          sku_numbers,
          price,
          created_at,
          category_id
        } = req.body;

        const sku = `${sku_letters.toUpperCase()}${sku_numbers}`;

        const existingSku = db.prepare(`
          SELECT id
          FROM products
          WHERE sku = ?
        `).get(sku);

        if (existingSku) {
          return res.status(400).send("SKU already exists");
        }

        const pictureFront = req.files.picture_front
          ? `/images/products/${req.files.picture_front[0].filename}`
          : null;

        const pictureBack = req.files.picture_back
          ? `/images/products/${req.files.picture_back[0].filename}`
          : null;

        db.prepare(`
          INSERT INTO products (
            type,
            description,
            brand,
            sku,
            price,
            picture_front,
            picture_back,
            created_at,
            category_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          type,
          description,
          brand,
          sku,
          Number(price),
          pictureFront,
          pictureBack,
          created_at ? created_at.replace("T", " ") : null,
          category_id || null
        );

        res.redirect("/admin/products");
      } catch (err) {
        next(err);
      }
    }
  );

  router.get("/admin/products/:id/edit", requireAdmin, (req, res, next) => {
    try {
      const product = db.prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `).get(req.params.id);

      if (!product) {
        return res.status(404).send("Product not found");
      }

      const categories = db.prepare(`
        SELECT *
        FROM categories
        ORDER BY name
      `).all();

      res.render("admin/edit-product", {
        title: "Redigera produkt",
        product,
        categories,
        isNew: false
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/admin/products/:id/edit",
    requireAdmin,
    upload.fields([
      { name: "picture_front", maxCount: 1 },
      { name: "picture_back", maxCount: 1 }
    ]),
    (req, res, next) => {
      try {
        const {
          type,
          description,
          brand,
          sku_letters,
          sku_numbers,
          price,
          created_at,
          category_id
        } = req.body;

        const sku = `${sku_letters.toUpperCase()}${sku_numbers}`;

        const existingSku = db.prepare(`
          SELECT id
          FROM products
          WHERE sku = ?
          AND id != ?
        `).get(sku, req.params.id);

        if (existingSku) {
          return res.status(400).send("SKU already exists");
        }

        const existingProduct = db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(req.params.id);

        const pictureFront = req.files.picture_front
          ? `/images/products/${req.files.picture_front[0].filename}`
          : existingProduct.picture_front;

        const pictureBack = req.files.picture_back
          ? `/images/products/${req.files.picture_back[0].filename}`
          : existingProduct.picture_back;

        db.prepare(`
          UPDATE products
          SET type = ?,
              description = ?,
              brand = ?,
              sku = ?,
              price = ?,
              picture_front = ?,
              picture_back = ?,
              created_at = ?,
              category_id = ?
          WHERE id = ?
        `).run(
          type,
          description,
          brand,
          sku,
          Number(price),
          pictureFront,
          pictureBack,
          created_at ? created_at.replace("T", " ") : null,
          category_id || null,
          req.params.id
        );

        res.redirect("/admin/products");
      } catch (err) {
        next(err);
      }
    }
  );

  router.post("/admin/products/:id/delete", requireAdmin, (req, res, next) => {
    try {
      db.prepare(`
        DELETE FROM products
        WHERE id = ?
      `).run(req.params.id);

      res.redirect("/admin/products");
    } catch (err) {
      next(err);
    }
  });

  return router;
};