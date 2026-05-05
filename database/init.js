const fs = require("fs");
const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(
  path.join(__dirname, "freaky-fashion.db")
);
const schema = fs.readFileSync("./schema.sql", "utf-8");
db.exec(schema);
console.log("✅ Database initialized successfully");