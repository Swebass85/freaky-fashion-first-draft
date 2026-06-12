# Freaky Fashion

Freaky Fashion is an e-commerce web application built with Node.js, Express, EJS, SQLite, and JavaScript.

The application includes:

* Product catalogue
* Product categories
* Product detail pages
* Favorites
* Shopping basket
* User registration and login
* Admin panel
* Product management
* Category management
* Product search
* Responsive design

---

# Installation

## Clone the project

```bash
git clone <repository-url>
cd freaky-fashion-first-draft
```

---

## Install dependencies

```bash
npm install
```

---

# Development Environment

This project uses:

* Express
* EJS
* Better SQLite3
* Nodemon
* Browser Sync
* Concurrently

Install development dependencies:

```bash
npm install --save-dev concurrently nodemon browser-sync
```

---

# Run the project

Start both the Express server and Browser Sync:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3001
```

Browser Sync proxies:

```text
http://localhost:3000
```

---

# Package Scripts

```json
"scripts": {
  "server": "nodemon ./bin/www",
  "client": "browser-sync start --proxy \"http://localhost:3000\" --port 3001 --ui-port 3002 --files \"public/**/*, views/**/*\" --browser chrome",
  "dev": "concurrently \"npm run server\" \"npm run client\""
}
```

---

# Database Setup

The application uses SQLite with Better SQLite3.

Database location:

```text
/database/freaky-fashion.db
```

Schema location:

```text
/database/schema.sql
```

The database schema is automatically loaded when the application starts.

---

# Database Tables

## users

Stores user accounts.

| Column        | Type     |
| ------------- | -------- |
| id            | INTEGER  |
| first_name    | TEXT     |
| last_name     | TEXT     |
| email         | TEXT     |
| password      | TEXT     |
| birthday      | DATE     |
| administrator | INTEGER  |
| created_at    | DATETIME |

---

## categories

Stores product categories.

| Column     | Type     |
| ---------- | -------- |
| id         | INTEGER  |
| name       | TEXT     |
| slug       | TEXT     |
| image      | TEXT     |
| created_at | DATETIME |

---

## products

Stores products displayed in the shop.

| Column        | Type     |
| ------------- | -------- |
| id            | INTEGER  |
| type          | TEXT     |
| brand         | TEXT     |
| price         | REAL     |
| picture_front | TEXT     |
| picture_back  | TEXT     |
| sku           | TEXT     |
| slug          | TEXT     |
| description   | TEXT     |
| category_id   | INTEGER  |
| created_at    | DATETIME |

---

## favorites

Stores user favorite products.

| Column     | Type     |
| ---------- | -------- |
| id         | INTEGER  |
| user_id    | INTEGER  |
| product_id | INTEGER  |
| created_at | DATETIME |

---

## cart_items

Stores shopping basket items.

| Column     | Type     |
| ---------- | -------- |
| id         | INTEGER  |
| user_id    | INTEGER  |
| session_id | TEXT     |
| product_id | INTEGER  |
| quantity   | INTEGER  |
| created_at | DATETIME |

---

# Features

## Customer Features

* Browse products
* View product details
* Search products
* Browse categories
* View latest products
* Add products to favorites
* Add products to basket
* Update basket quantity
* Remove basket items
* Register account
* Login / Logout

---

## Admin Features

* View products
* Create products
* Edit products
* Delete products
* Upload product images
* Create categories
* Delete categories
* Manage category images

---

# Project Structure

```text
freaky-fashion-first-draft/

├── app.js
├── package.json
├── database/
│   ├── schema.sql
│   └── freaky-fashion.db
│
├── routes/
│   ├── administration.js
│   ├── auth.js
│   ├── checkout.js
│   ├── index.js
│   └── users.js
│
├── public/
│   ├── images/
│   ├── icons/
│   ├── javascripts/
│   └── stylesheets/
│
├── views/
│   ├── partials/
│   ├── admin/
│   ├── index.ejs
│   ├── products.ejs
│   ├── basket.ejs
│   ├── favorites.ejs
│   ├── news.ejs
│   └── login.ejs
│
└── bin/
    └── www
```

---

# Technologies

* Node.js
* Express
* EJS
* SQLite
* Better SQLite3
* JavaScript
* HTML
* CSS
* Browser Sync
* Nodemon

---

# Author

Sebastian Åkerman

Backend Development Course Project
Freaky Fashion
