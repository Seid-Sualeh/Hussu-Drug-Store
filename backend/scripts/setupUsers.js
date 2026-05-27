import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const config = process.env.DATABASE_URL
  ? { uri: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    };

async function setupUsers() {
  const conn = await mysql.createConnection(config);
  
  try {
    console.log("Checking existing users...");
    
    const [existingRows] = await conn.query("SELECT username FROM users");
    if (existingRows.length > 0) {
      console.log("Users already exist:", existingRows.map(r => r.username).join(", "));
      return;
    }

    const adminPassword = process.env.ADMIN_PASSWORD || "hussudrugstore";
    const guestPassword = process.env.GUEST_PASSWORD || "hussuguest";

    const adminHash = await bcrypt.hash(adminPassword, 10);
    const guestHash = await bcrypt.hash(guestPassword, 10);

    await conn.query(
      "INSERT INTO users (username, password_hash, name, role, avatar_initials, email) VALUES (?, ?, ?, ?, ?, ?)",
      ["abu@miftah", adminHash, "Admin User", "admin", "AU", "hussudrugstore@gmail.com"]
    );
    console.log("Created admin user (abu@miftah)");

    await conn.query(
      "INSERT INTO users (username, password_hash, name, role, avatar_initials, email) VALUES (?, ?, ?, ?, ?, ?)",
      ["storegust", guestHash, "Guest User", "guest", "GU", "guest@hussudrugstore.com"]
    );
    console.log("Created guest user (storegust)");

    console.log("\nUsers created successfully!");
    console.log("Login credentials:");
    console.log("  Admin: abu@miftah / " + adminPassword);
    console.log("  Guest: storegust / " + guestPassword);
  } catch (err) {
    console.error("Error setting up users:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

setupUsers();