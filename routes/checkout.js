const express = require("express");
const router = express.Router();

module.exports = (db) => {
  /* ADD ITEM TO BASKET */
  router.post("/basket/:id", (req, res, next) => {
    try {
      const productId = Number(req.params.id);
      const userId = req.session.userId;

      if (!productId) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid product id" });
      }

      if (!userId) {
        if (!req.session.basket) {
          req.session.basket = [];
        }

        if (!req.session.quantities) {
          req.session.quantities = {};
        }

        if (!req.session.basket.includes(productId)) {
          req.session.basket.push(productId);
          req.session.quantities[productId] = 1;
        }

        req.session.basketCount = req.session.basket.length;

        return res.json({
          success: true,
          count: req.session.basketCount,
        });
      }

      db.prepare(
        `
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, product_id)
        DO UPDATE SET quantity = quantity + 1
      `,
      ).run(userId, productId);

      const basketCount = db
        .prepare(
          `
        SELECT COALESCE(SUM(quantity), 0) AS count
        FROM cart_items
        WHERE user_id = ?
      `,
        )
        .get(userId).count;

      req.session.basketCount = basketCount;

      res.json({
        success: true,
        count: basketCount,
      });
    } catch (err) {
      next(err);
    }
  });

  /* SHOW BASKET PAGE */
  router.get("/basket", (req, res, next) => {
    try {
      const userId = req.session.userId;

      if (userId) {
        const products = db
          .prepare(
            `
          SELECT products.*,
          cart_items.quantity,
          julianday('now') - julianday(products.created_at) AS age_days
          FROM cart_items
          JOIN products ON products.id = cart_items.product_id
          WHERE cart_items.user_id = ?
        `,
          )
          .all(userId);

        return res.render("basket", {
          title: "Varukorg",
          products,
        });
      }

      const basketIds = req.session.basket || [];
      const quantities = req.session.quantities || {};

      if (basketIds.length === 0) {
        return res.render("basket", {
          title: "Varukorg",
          products: [],
        });
      }

      const placeholders = basketIds.map(() => "?").join(",");

      const products = db
        .prepare(
          `
        SELECT *,
        julianday('now') - julianday(created_at) AS age_days
        FROM products
        WHERE id IN (${placeholders})
      `,
        )
        .all(...basketIds)
        .map((product) => ({
          ...product,
          quantity: quantities[product.id] || 1,
        }));

      res.render("basket", {
        title: "Varukorg",
        products,
      });
    } catch (err) {
      next(err);
    }
  });

  /* UPDATE QUANTITY */
  router.post("/basket/update/:id", (req, res, next) => {
    try {
      const productId = Number(req.params.id);
      const quantity = Number(req.body.quantity);
      const userId = req.session.userId;

      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          error: "Invalid product or quantity",
        });
      }

      if (userId) {
        db.prepare(
          `
          UPDATE cart_items
          SET quantity = ?
          WHERE user_id = ?
          AND product_id = ?
        `,
        ).run(quantity, userId, productId);

        const basketCount = db
          .prepare(
            `
          SELECT COALESCE(SUM(quantity), 0) AS count
          FROM cart_items
          WHERE user_id = ?
        `,
          )
          .get(userId).count;

        req.session.basketCount = basketCount;
      } else {
        if (!req.session.basket) {
          req.session.basket = [];
        }

        if (!req.session.quantities) {
          req.session.quantities = {};
        }

        if (!req.session.basket.includes(productId)) {
          req.session.basket.push(productId);
        }

        req.session.quantities[productId] = quantity;

        req.session.basketCount = req.session.basket.reduce((sum, id) => {
          return sum + Number(req.session.quantities[id] || 1);
        }, 0);
      }

      res.json({
        success: true,
        count: req.session.basketCount,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/basket/remove/:id", (req, res, next) => {
    try {
      const productId = Number(req.params.id);
      const userId = req.session.userId;

      if (userId) {
        const item = db
          .prepare(
            `
        SELECT quantity
        FROM cart_items
        WHERE user_id = ?
        AND product_id = ?
      `,
          )
          .get(userId, productId);

        if (item) {
          if (item.quantity > 1) {
            db.prepare(
              `
            UPDATE cart_items
            SET quantity = quantity - 1
            WHERE user_id = ?
            AND product_id = ?
          `,
            ).run(userId, productId);
          } else {
            db.prepare(
              `
            DELETE FROM cart_items
            WHERE user_id = ?
            AND product_id = ?
          `,
            ).run(userId, productId);
          }
        }

        const basketCount = db
          .prepare(
            `
        SELECT COALESCE(SUM(quantity), 0) AS count
        FROM cart_items
        WHERE user_id = ?
      `,
          )
          .get(userId).count;

        req.session.basketCount = basketCount;
      } else {
        if (!req.session.quantities) {
          req.session.quantities = {};
        }

        const currentQty = req.session.quantities[productId] || 1;

        if (currentQty > 1) {
          req.session.quantities[productId] = currentQty - 1;
        } else {
          req.session.basket = (req.session.basket || []).filter(
            (id) => id !== productId,
          );

          delete req.session.quantities[productId];
        }

        req.session.basketCount = Object.values(req.session.quantities).reduce(
          (sum, qty) => sum + qty,
          0,
        );
      }

      res.json({
        success: true,
        count: req.session.basketCount,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
