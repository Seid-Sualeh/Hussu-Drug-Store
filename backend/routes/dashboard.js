import { Router } from 'express';
import pool from '../config/db.js';
import { formatMedicineRow } from '../utils/inventoryHelpers.js';
import { withDb, dbErrorMessage } from '../utils/dbQuery.js';
import { getDashboardFallback } from '../utils/fallbackData.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const payload = await withDb(async (db) => {
    const [[summary]] = await db.query(`
      SELECT
        COUNT(*) AS totalMedicines,
        COALESCE(SUM(qty), 0) AS totalQuantity,
        COALESCE(SUM(qty * buy_price), 0) AS inventoryValue,
        COALESCE(SUM((sell_price - buy_price) * qty), 0) AS totalProfit,
        SUM(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH) AND expiry_date >= CURDATE() THEN 1 ELSE 0 END) AS expiringIn6Months,
        SUM(CASE WHEN qty > 0 AND qty < min_limit THEN 1 ELSE 0 END) AS underStock,
        SUM(CASE WHEN qty > max_limit THEN 1 ELSE 0 END) AS overStock,
        SUM(CASE WHEN qty = 0 THEN 1 ELSE 0 END) AS outOfStock,
        SUM(CASE WHEN qty >= min_limit AND qty <= max_limit THEN 1 ELSE 0 END) AS normalStock
      FROM medicines
    `);

    const [expiryRows] = await db.query(`
      SELECT m.*, c.name AS category_name, s.name AS supplier_name,
        DATEDIFF(m.expiry_date, CURDATE()) AS days_left
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH)
      ORDER BY m.expiry_date ASC
      LIMIT 50
    `);

    const expiryAlerts = expiryRows.map((row, i) => {
      const formatted = formatMedicineRow(row, i + 1);
      const daysLeft = Number(row.days_left);
      let status = 'safe';
      if (daysLeft < 0) status = 'expired';
      else if (daysLeft <= 180) status = 'expiring';
      return {
        ...formatted,
        daysLeft,
        daysLabel:
          daysLeft < 0
            ? `Expired ${Math.abs(daysLeft)} days ago`
            : daysLeft === 0
              ? 'Expires today'
              : `${daysLeft} Days`,
        status,
      };
    });

    const [profitByCategory] = await db.query(`
      SELECT
        COALESCE(c.name, 'Uncategorized') AS category,
        COALESCE(c.code, '') AS code,
        COUNT(m.id) AS medicineCount,
        COALESCE(SUM((m.sell_price - m.buy_price) * m.qty), 0) AS profit,
        COALESCE(SUM(m.qty), 0) AS totalQty
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      GROUP BY c.id, c.name, c.code, c.sort_order
      ORDER BY profit DESC
      LIMIT 10
    `);

    const [categoryDistribution] = await db.query(`
      SELECT
        COALESCE(c.name, 'Uncategorized') AS category,
        COALESCE(c.code, '') AS code,
        COUNT(m.id) AS medicineCount,
        COALESCE(SUM(m.qty), 0) AS totalQty
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      GROUP BY c.id, c.name, c.code, c.sort_order
      ORDER BY totalQty DESC
      LIMIT 8
    `);

    const [supplierPerformance] = await db.query(`
      SELECT
        COALESCE(s.name, 'Unknown') AS supplier,
        COUNT(m.id) AS totalMedicines,
        COALESCE(SUM(m.qty), 0) AS totalQuantity
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      GROUP BY s.id, s.name
      ORDER BY totalMedicines DESC
      LIMIT 10
    `);

    const [shelfTracking] = await db.query(`
      SELECT
        COALESCE(NULLIF(shelf_no, ''), 'Unassigned') AS shelf,
        COUNT(*) AS medicineCount
      FROM medicines
      GROUP BY shelf_no
      ORDER BY medicineCount DESC
      LIMIT 12
    `);

    const [shelfMedicines] = await db.query(`
      SELECT shelf_no AS shelf, name, strength_form AS strengthForm, qty
      FROM medicines
      WHERE shelf_no IS NOT NULL AND shelf_no != ''
      ORDER BY shelf_no, name
      LIMIT 200
    `);

    const shelvesMap = {};
    shelfMedicines.forEach((m) => {
      if (!shelvesMap[m.shelf]) shelvesMap[m.shelf] = [];
      if (shelvesMap[m.shelf].length < 5) shelvesMap[m.shelf].push(m);
    });

    const [urgentRows] = await db.query(`
      SELECT m.*, c.name AS category_name, s.name AS supplier_name
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.qty = 0 OR (m.qty > 0 AND m.qty < m.min_limit)
      ORDER BY
        CASE WHEN m.qty = 0 THEN 0 ELSE 1 END,
        (m.qty / NULLIF(m.min_limit, 0)) ASC,
        m.name ASC
      LIMIT 25
    `);

    const urgentReorder = urgentRows.map((row, i) => formatMedicineRow(row, i + 1));

    return {
      summary: {
        totalMedicines: Number(summary.totalMedicines),
        totalQuantity: Number(summary.totalQuantity),
        expiringIn6Months: Number(summary.expiringIn6Months),
        underStock: Number(summary.underStock),
        lowStock: Number(summary.underStock),
        overStock: Number(summary.overStock),
        outOfStock: Number(summary.outOfStock),
        totalProfit: Number(summary.totalProfit),
        inventoryValue: Number(summary.inventoryValue),
        normalStock: Number(summary.normalStock),
      },
      stockChart: {
        underStock: Number(summary.underStock),
        normal: Number(summary.normalStock),
        overStock: Number(summary.overStock),
        outOfStock: Number(summary.outOfStock),
      },
      expiryAlerts,
      profitByCategory: profitByCategory.map((r) => ({
        category: r.code ? `${r.code}. ${r.category}` : r.category,
        profit: Number(r.profit),
        medicineCount: Number(r.medicineCount),
        totalQty: Number(r.totalQty),
      })),
      categoryDistribution: categoryDistribution.map((r) => ({
        category: r.code ? `${r.code}. ${r.category}` : r.category,
        medicineCount: Number(r.medicineCount),
        totalQty: Number(r.totalQty),
      })),
      supplierPerformance: supplierPerformance.map((r) => ({
        supplier: r.supplier,
        totalMedicines: Number(r.totalMedicines),
        totalQuantity: Number(r.totalQuantity),
      })),
      shelfTracking: shelfTracking.map((r) => ({
        shelf: r.shelf,
        medicineCount: Number(r.medicineCount),
        medicines: shelvesMap[r.shelf] || [],
      })),
      urgentReorder,
    };
    }, getDashboardFallback);

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

export default router;
