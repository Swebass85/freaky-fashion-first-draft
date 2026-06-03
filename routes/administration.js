const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/products");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
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

  router.get("/administration/products/:id/edit", requireAdmin, (req, res, next) => {
    try {
      const product = db.prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `).get(req.params.id);

      if (!product) {
        return res.status(404).send("Product not found");
      }

      res.render("edit-product", {
        title: "Redigera produkt",
        product,
        isNew: false
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/administration/products/:id/edit",
    requireAdmin,
    upload.fields([
      { name: "picture_front", maxCount: 1 },
      { name: "picture_back", maxCount: 1 }
    ]),
    (req, res, next) => {
      try {
        const { type, brand, sku, price } = req.body;

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
              brand = ?,
              sku = ?,
              price = ?,
              picture_front = ?,
              picture_back = ?
          WHERE id = ?
        `).run(
          type,
          brand,
          sku,
          Number(price),
          pictureFront,
          pictureBack,
          req.params.id
        );

        res.redirect("/administration");
      } catch (err) {
        next(err);
      }
    }
  );

  router.post("/administration/products/:id/delete", requireAdmin, (req, res, next) => {
    try {
      db.prepare(`
        DELETE FROM products
        WHERE id = ?
      `).run(req.params.id);

      res.redirect("/administration");
    } catch (err) {
      next(err);
    }
  });
    
    router.get("/administration/products/new", requireAdmin, (req, res) => {
  res.render("edit-product", {
    title: "Lägg till produkt",
    product: {
      id: null,
      type: "",
      brand: "",
      sku: "",
      price: "",
      picture_front: "",
      picture_back: ""
    },
    isNew: true
  });
});

router.post(
  "/administration/products/new",
  requireAdmin,
  upload.fields([
    { name: "picture_front", maxCount: 1 },
    { name: "picture_back", maxCount: 1 }
  ]),
  (req, res, next) => {
    try {
      const { type, brand, sku, price } = req.body;

      const pictureFront = req.files.picture_front
        ? `/images/products/${req.files.picture_front[0].filename}`
        : null;

      const pictureBack = req.files.picture_back
        ? `/images/products/${req.files.picture_back[0].filename}`
        : null;

      db.prepare(`
        INSERT INTO products (
          type,
          brand,
          sku,
          price,
          picture_front,
          picture_back
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        type,
        brand,
        sku,
        Number(price),
        pictureFront,
        pictureBack
      );

      res.redirect("/administration");
    } catch (err) {
      next(err);
    }
  }
);

  return router;
};