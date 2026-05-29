import { Router } from "express";
import pool from "../config/db.js";
import {
  formatMedicineRow,
  getStockStatus,
  getExpiryInfo,
} from "../utils/inventoryHelpers.js";
import { validateMedicineBody } from "../utils/validateMedicine.js";

const router = Router();

function formatDateYMD(date) {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

function generateMedicineNotifications({
  name,
  qty,
  minLimit,
  maxLimit,
  expiryDate,
}) {
  const notifications = [];
  const today = new Date().toISOString().slice(0, 10);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  const sixMonthsDate = sixMonths.toISOString().slice(0, 10);

  if (qty > 0 && qty < minLimit) {
    notifications.push({
      title: `Low stock: ${name}`,
      message: `${name} has only ${qty} unit(s) remaining. Reorder before stock runs out.`,
      type: "low_stock",
    });
  }

  if (qty > maxLimit) {
    notifications.push({
      title: `Over stock: ${name}`,
      message: `${name} inventory exceeds the maximum of ${maxLimit}. Review ordering levels.`,
      type: "over_stock",
    });
  }

  if (expiryDate) {
    const expiry = expiryDate;
    if (expiry <= today) {
      notifications.push({
        title: `Expired: ${name}`,
        message: `${name} expired on ${expiry}. Remove or mark it immediately.`,
        type: "expiry",
      });
    } else if (expiry <= sixMonthsDate) {
      notifications.push({
        title: `Expiring soon: ${name}`,
        message: `${name} expires on ${expiry}. Plan moving or discounting stock.`,
        type: "expiry",
      });
    }
  }

  return notifications;
}

async function insertNotifications(items) {
  for (const { title, message, type } of items) {
    const [[existing]] = await pool.query(
      "SELECT COUNT(*) AS count FROM notifications WHERE title = ? AND message = ? AND type = ? AND is_read = 0",
      [title, message, type],
    );
    if (Number(existing.count) === 0) {
      await pool.query(
        "INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)",
        [title, message, type],
      );
    }
  }
}

const BASE_SELECT = `
  SELECT m.*, c.name AS category_name, s.name AS supplier_name
  FROM medicines m
  LEFT JOIN categories c ON m.category_id = c.id
  LEFT JOIN suppliers s ON m.supplier_id = s.id
`;

function buildWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.categoryId && filters.categoryId !== "all") {
    conditions.push("m.category_id = ?");
    params.push(filters.categoryId);
  }
  if (filters.search) {
    conditions.push(
      "(m.name LIKE ? OR m.strength_form LIKE ? OR s.name LIKE ? OR c.name LIKE ?)",
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }
  if (filters.expiry === "expiring") {
    conditions.push("m.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH)");
    conditions.push("m.expiry_date >= CURDATE()");
  } else if (filters.expiry === "expired") {
    conditions.push("m.expiry_date < CURDATE()");
  } else if (filters.expiry === "safe") {
    conditions.push("m.expiry_date > DATE_ADD(CURDATE(), INTERVAL 6 MONTH)");
  }
  if (filters.stockStatus === "under") {
    conditions.push("m.qty > 0 AND m.qty < m.min_limit");
  } else if (filters.stockStatus === "over") {
    conditions.push("m.qty > m.max_limit");
  } else if (filters.stockStatus === "out") {
    conditions.push("m.qty = 0");
  } else if (filters.stockStatus === "normal") {
    conditions.push("m.qty >= m.min_limit AND m.qty <= m.max_limit");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

router.get("/stats", async (req, res) => {
  try {
    const sessionUser = req.user;
    const [[totals]] = await pool.query(`
        SELECT
          COUNT(*) AS totalMedicines,
          COALESCE(SUM(qty), 0) AS totalQuantity,
          COALESCE(SUM(qty * buy_price), 0) AS inventoryValue,
          COALESCE(SUM((sell_price - buy_price) * qty), 0) AS totalProfit,
          SUM(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH) AND expiry_date >= CURDATE() THEN 1 ELSE 0 END) AS expiringIn6Months,
          SUM(CASE WHEN qty > 0 AND qty < min_limit THEN 1 ELSE 0 END) AS lowStock,
          SUM(CASE WHEN qty > max_limit THEN 1 ELSE 0 END) AS overStock,
          SUM(CASE WHEN qty = 0 THEN 1 ELSE 0 END) AS outOfStock
        FROM medicines
      `);

    let notificationCount = 0;
    try {
      const [[notif]] = await pool.query(
        "SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0",
      );
      notificationCount = Number(notif.count);
    } catch {
      notificationCount = 0;
    }

    const response = {
      totalMedicines: Number(totals.totalMedicines),
      totalQuantity: Number(totals.totalQuantity),
      inventoryValue: Number(totals.inventoryValue),
      totalItems: Number(totals.totalMedicines),
      expiringIn6Months: Number(totals.expiringIn6Months),
      lowStock: Number(totals.lowStock),
      overStock: Number(totals.overStock),
      outOfStock: Number(totals.outOfStock),
      totalProfit: Number(totals.totalProfit),
      user: sessionUser
        ? {
            id: sessionUser.id,
            name: sessionUser.name,
            role: sessionUser.role,
            avatar_initials: sessionUser.avatar_initials,
            email: sessionUser.email,
            notification_count: notificationCount,
          }
        : null,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, code, name, sort_order FROM categories ORDER BY sort_order ASC, id ASC",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/suppliers", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM suppliers ORDER BY name",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      500,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );
    const offset = (page - 1) * limit;

    const filters = {
      categoryId: req.query.categoryId,
      search: req.query.search?.trim(),
      expiry: req.query.expiry,
      stockStatus: req.query.stockStatus,
    };

    const { where, params } = buildWhere(filters);

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM medicines m
       LEFT JOIN categories c ON m.category_id = c.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       ${where}`,
      params,
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `${BASE_SELECT} ${where} ORDER BY m.id ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const items = rows.map((row, i) => formatMedicineRow(row, offset + i + 1));

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        from: total === 0 ? 0 : offset + 1,
        to: Math.min(offset + limit, total),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/search-global", async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);
    const term = `%${q}%`;
    const [rows] = await pool.query(
      `${BASE_SELECT}
       WHERE m.name LIKE ? OR m.strength_form LIKE ? OR c.name LIKE ? OR s.name LIKE ?
       LIMIT 10`,
      [term, term, term, term],
    );
    res.json(rows.map((r, i) => formatMedicineRow(r, i + 1)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(`${BASE_SELECT} WHERE m.id = ?`, [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: "Medicine not found" });
    res.json(formatMedicineRow(rows[0], 1));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const validation = validateMedicineBody(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.errors.join(". ") });
    }
    const {
      name,
      unit,
      strengthForm,
      categoryId,
      supplierId,
      qty,
      expiryDate,
      minLimit,
      maxLimit,
      buyPrice,
      sellPrice,
      shelfNo,
      notes,
    } = validation.data;

    const notifications = generateMedicineNotifications({
      name,
      qty,
      minLimit,
      maxLimit,
      expiryDate,
    });

    const [result] = await pool.query(
      `INSERT INTO medicines
       (name, unit, strength_form, category_id, supplier_id, qty, expiry_date, min_limit, max_limit, buy_price, sell_price, shelf_no, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        unit || null,
        strengthForm,
        categoryId || null,
        supplierId || null,
        qty ?? 0,
        expiryDate,
        minLimit ?? 10,
        maxLimit ?? 500,
        buyPrice,
        sellPrice,
        shelfNo || null,
        notes || null,
      ],
    );

    if (notifications.length) {
      await insertNotifications(notifications);
    }

    const [rows] = await pool.query(`${BASE_SELECT} WHERE m.id = ?`, [
      result.insertId,
    ]);
    res.status(201).json(formatMedicineRow(rows[0], 1));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const validation = validateMedicineBody(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.errors.join(". ") });
    }
    const {
      name,
      unit,
      strengthForm,
      categoryId,
      supplierId,
      qty,
      expiryDate,
      minLimit,
      maxLimit,
      buyPrice,
      sellPrice,
      shelfNo,
      notes,
    } = validation.data;

    const notifications = generateMedicineNotifications({
      name,
      qty,
      minLimit,
      maxLimit,
      expiryDate,
    });

    await pool.query(
      `UPDATE medicines SET
        name = ?, unit = ?, strength_form = ?, category_id = ?, supplier_id = ?,
        qty = ?, expiry_date = ?, min_limit = ?, max_limit = ?,
        buy_price = ?, sell_price = ?, shelf_no = ?, notes = ?
       WHERE id = ?`,
      [
        name,
        unit || null,
        strengthForm,
        categoryId || null,
        supplierId || null,
        qty,
        expiryDate,
        minLimit,
        maxLimit,
        buyPrice,
        sellPrice,
        shelfNo || null,
        notes || null,
        req.params.id,
      ],
    );

    if (notifications.length) {
      await insertNotifications(notifications);
    }

    const [rows] = await pool.query(`${BASE_SELECT} WHERE m.id = ?`, [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: "Medicine not found" });
    res.json(formatMedicineRow(rows[0], 1));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM medicines WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Medicine not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
