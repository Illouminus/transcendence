import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";


const dbPath = path.resolve(__dirname, "../db/data.sqlite"); // Ecole Docker

//const dbPath = path.resolve(__dirname, "../../db/data.sqlite"); - Mac
const schemaPath = path.resolve(__dirname, "schema.sql");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("✅ Connected to SQLite database");
    initializeDatabase();
  }
});

function initializeDatabase() {
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema, (err) => {
    if (err) {
      console.error("❌ Error initializing database:", err);
    } else {
      console.log("✅ Database tables initialized");
    }
  });
}

export default db;
