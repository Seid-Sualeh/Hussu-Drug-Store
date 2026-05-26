#!/usr/bin/env node

/**
 * Generate test data for load testing
 * Usage: node generateTestData.js --medicines 5000 --transactions 50000
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse CLI arguments
const args = process.argv.slice(2);
const medicineCount = parseInt(
  args[args.indexOf("--medicines") + 1] || "1000",
  10,
);
const transactionCount = parseInt(
  args[args.indexOf("--transactions") + 1] || "5000",
  10,
);
const supplierCount = Math.min(50, Math.ceil(medicineCount / 50));

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "drug_store",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log("🔄 Generating test data...");
console.log(`  Medicines: ${medicineCount}`);
console.log(`  Transactions: ${transactionCount}`);
console.log(`  Suppliers: ${supplierCount}`);

async function generateData() {
  const conn = await mysql.createConnection(config);

  try {
    // Clear existing data
    console.log("\n📋 Clearing existing data...");
    await conn.query("DELETE FROM stock_movements");
    await conn.query("DELETE FROM sales_items");
    await conn.query("DELETE FROM sales");
    await conn.query("DELETE FROM medicines");
    await conn.query("DELETE FROM suppliers");
    await conn.query("DELETE FROM categories");
    console.log("✅ Data cleared");

    // Categories
    console.log("\n📦 Creating categories...");
    const categories = [
      "Antibiotics",
      "Painkillers",
      "Vitamins",
      "Cough Suppressants",
      "Antacids",
      "Antihistamines",
      "Skin Care",
      "Digestive",
    ];
    for (const cat of categories) {
      await conn.query(
        "INSERT INTO categories (name, description) VALUES (?, ?)",
        [cat, `${cat} category`],
      );
    }
    console.log(`✅ ${categories.length} categories created`);

    // Suppliers
    console.log(`\n🏢 Creating ${supplierCount} suppliers...`);
    const suppliers = [];
    for (let i = 1; i <= supplierCount; i++) {
      const result = await conn.query(
        "INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)",
        [
          `Supplier-${i}`,
          `Contact-${i}`,
          `supplier${i}@example.com`,
          `+1234567${String(i).padStart(3, "0")}`,
          `Address ${i}, City`,
        ],
      );
      suppliers.push(result[0].insertId);
    }
    console.log(`✅ ${supplierCount} suppliers created`);

    // Medicines
    console.log(`\n💊 Creating ${medicineCount} medicines...`);
    const medicineNames = [
      "Paracetamol",
      "Ibuprofen",
      "Amoxicillin",
      "Ciprofloxacin",
      "Metformin",
      "Lisinopril",
      "Omeprazole",
      "Diphenhydramine",
    ];
    const batchSize = 100;
    let batchInserts = [];

    for (let i = 1; i <= medicineCount; i++) {
      const categoryId = (i % categories.length) + 1;
      const supplierId = suppliers[i % suppliers.length];
      const medName = `${medicineNames[i % medicineNames.length]}-${i}`;

      batchInserts.push([
        medName,
        categoryId,
        supplierId,
        10 + Math.random() * 1000, // price
        Math.floor(Math.random() * 500) + 50, // quantity
        Math.floor(Math.random() * 500) + 50, // reorder_level
        new Date(Date.now() + Math.random() * 365 * 24 * 3600 * 1000)
          .toISOString()
          .split("T")[0], // expiry
        `Batch-${i}`,
        "Active",
      ]);

      if (batchInserts.length === batchSize || i === medicineCount) {
        for (const med of batchInserts) {
          await conn.query(
            `INSERT INTO medicines 
              (name, category_id, supplier_id, price, quantity, reorder_level, expiry_date, batch_number, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            med,
          );
        }
        process.stdout.write(
          `\r  Progress: ${Math.min(i, medicineCount)}/${medicineCount}`,
        );
        batchInserts = [];
      }
    }
    console.log(`\n✅ ${medicineCount} medicines created`);

    // Stock Movements
    console.log(`\n📊 Creating ${transactionCount} stock transactions...`);
    for (let i = 1; i <= transactionCount; i++) {
      const medicineId = (i % medicineCount) + 1;
      const quantity = Math.floor(Math.random() * 500) + 10;
      const type = Math.random() > 0.5 ? "in" : "out";
      const reason = type === "in" ? "Purchase" : "Sale";

      await conn.query(
        `INSERT INTO stock_movements 
          (medicine_id, quantity, type, reason, reference_number, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          medicineId,
          quantity,
          type,
          reason,
          `REF-${i}`,
          new Date(Date.now() - Math.random() * 365 * 24 * 3600 * 1000),
        ],
      );

      if (i % 1000 === 0) {
        process.stdout.write(`\r  Progress: ${i}/${transactionCount}`);
      }
    }
    console.log(`\n✅ ${transactionCount} stock transactions created`);

    // Sales (1/10 of transactions)
    console.log(`\n💰 Creating sales records...`);
    const salesCount = Math.floor(transactionCount / 10);
    for (let i = 1; i <= salesCount; i++) {
      const medicineId = (i % medicineCount) + 1;
      const quantity = Math.floor(Math.random() * 50) + 1;

      const medicinePrice = await conn.query(
        "SELECT price FROM medicines WHERE id = ?",
        [medicineId],
      );
      const price = medicinePrice[0][0]?.price || 10;
      const total = quantity * price;

      const saleResult = await conn.query(
        "INSERT INTO sales (total_amount, notes, created_at) VALUES (?, ?, ?)",
        [
          total,
          `Sale-${i}`,
          new Date(Date.now() - Math.random() * 180 * 24 * 3600 * 1000),
        ],
      );

      await conn.query(
        "INSERT INTO sales_items (sale_id, medicine_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [saleResult[0].insertId, medicineId, quantity, price],
      );

      if (i % 500 === 0) {
        process.stdout.write(`\r  Progress: ${i}/${salesCount}`);
      }
    }
    console.log(`\n✅ ${salesCount} sales created`);

    console.log("\n🎉 Test data generation complete!");
    console.log(`\nDatabase stats:`);
    console.log(`  Categories: ${categories.length}`);
    console.log(`  Suppliers: ${supplierCount}`);
    console.log(`  Medicines: ${medicineCount}`);
    console.log(`  Stock Transactions: ${transactionCount}`);
    console.log(`  Sales: ${salesCount}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

generateData();
