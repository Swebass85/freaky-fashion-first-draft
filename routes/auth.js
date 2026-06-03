const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

module.exports = (db) => {
  router.get("/login", (req, res) => {
    res.render("login");
  });

  router.post("/register", (req, res) => {
    const { first_name, last_name, email, password, birthday } = req.body;

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);

      db.prepare(`
        INSERT INTO users (first_name, last_name, email, password, birthday)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        first_name,
        last_name,
        email,
        hashedPassword,
        birthday || null
      );

      res.redirect("/login");
    } catch (err) {
      console.error("Register error:", err);
      res.send("User already exists or invalid data");
    }
  });

  router.post("/login", (req, res) => {
    const { email, password } = req.body;

    try {
      const user = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(email);

      if (!user) {
        return res.send("User not found");
      }

      const valid = bcrypt.compareSync(password, user.password);

      if (!valid) {
        return res.send("Wrong password");
      }

      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.isAdmin = Number(user.administrator) === 1;
      console.log("administrator from db:", user.administrator);
      console.log("isAdmin in session:", req.session.isAdmin);

      const guestFavorites = req.session.favorites || [];

      const insertFavorite = db.prepare(`
        INSERT OR IGNORE INTO favorites (user_id, product_id)
        VALUES (?, ?)
      `);

      for (const productId of guestFavorites) {
        insertFavorite.run(user.id, productId);
      }

      const guestBasket = req.session.basket || [];
      const guestQuantities = req.session.quantities || {};

      const existingCartItem = db.prepare(`
  SELECT id, quantity
  FROM cart_items
  WHERE user_id = ?
  AND product_id = ?
`);

const insertCartItem = db.prepare(`
  INSERT INTO cart_items (user_id, product_id, quantity)
  VALUES (?, ?, ?)
`);

const updateCartItem = db.prepare(`
  UPDATE cart_items
  SET quantity = quantity + ?
  WHERE user_id = ?
  AND product_id = ?
`);

      for (const productId of guestBasket) {
  const quantity = Number(guestQuantities[productId] || 1);
  const existing = existingCartItem.get(user.id, productId);

  if (existing) {
    updateCartItem.run(quantity, user.id, productId);
  } else {
    insertCartItem.run(user.id, productId, quantity);
  }
}

      req.session.favorites = [];
      req.session.basket = [];
      req.session.quantities = {};

      req.session.favoritesCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM favorites
        WHERE user_id = ?
      `).get(user.id).count;

      req.session.basketCount = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) AS count
        FROM cart_items
        WHERE user_id = ?
      `).get(user.id).count;

      res.redirect("/");
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).send("Could not log in");
    }
  });

  router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.send("Could not log out");
      }

      res.redirect("/");
    });
  });

  return router;
};