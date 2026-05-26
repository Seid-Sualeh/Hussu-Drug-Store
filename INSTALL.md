# Database install guide

Use this guide the first time you set up Hussu Drug Store on a new machine.

## One-line summary

1. Start MySQL
2. Configure `backend/.env`
3. Run `node server.js` in `backend/`
4. Open **http://localhost:5000/install**
5. Start frontend and open **http://localhost:3000/welcome**

---

## What `/install` does

When you open `http://localhost:5000/install`, the server will:

1. Connect to MySQL using `backend/.env`
2. Create database `medicare_drug_store` (if missing)
3. Drop and recreate these tables:
   - `users`
   - `categories`
   - `suppliers`
   - `medicines`
   - `stock_movements`
   - `sales`
   - `settings`
   - `notifications`

4. Insert seed data (categories, suppliers, sample medicines, sales, notifications, settings)
5. Generate **1,256** medicine rows for realistic dashboard numbers
6. Set passwords for `admin` and `guest` users

**Console output** will include the line:

```
✓ All tables are created (8/8)
```

---

## Install URLs

| URL                                       | Result                          |
| ----------------------------------------- | ------------------------------- |
| http://localhost:5000/install             | HTML success page in browser    |
| http://localhost:5000/install?format=json | JSON response for tools/scripts |

---

## Default login (after install)

| Username | Password | Role        |
| -------- | -------- | ----------- |
| admin    | admin123 | Full access |
| guest    | guest123 | View only   |

---

## If install fails

```
INSTALL FAILED: connect ECONNREFUSED
```

**Fix:** MySQL is not running. Start Docker MySQL or local MySQL service, then retry `/install`.

```
ER_ACCESS_DENIED_ERROR
```

**Fix:** Wrong `DB_USER` or `DB_PASSWORD` in `backend/.env`.

---

## Re-install / reset database

Visiting `/install` again **wipes all data** and rebuilds tables. Safe for development; do not use on production with real data unless you intend to reset.

---

See [README.md](./README.md) for the complete project documentation.
