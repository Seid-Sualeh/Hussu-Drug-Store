# Hussu Drug Store — Pharmacy Inventory System

Full-stack pharmacy inventory management: dashboard, inventory, stock in/out, sales, suppliers, categories, reports, and role-based login (Admin / Guest).

---

## Tech stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18, Vite, Bootstrap 5, Chart.js           |
| Backend  | Node.js, Express                                |
| Database | MySQL 8                                         |
| Auth     | JWT, bcrypt (Admin = full access, Guest = view) |

---

## Project structure

```
Drug Store/
├── frontend/                 React UI (port 3000)
│   ├── src/
│   │   ├── pages/            Dashboard, Inventory, Sales, etc.
│   │   ├── components/       Sidebar, Topbar, tables
│   │   ├── context/          Auth (login state)
│   │   └── api/              API client
│   └── package.json
├── backend/                  Express API (port 5000)
│   ├── routes/               REST endpoints
│   ├── scripts/
│   │   ├── schema.sql        All table definitions
│   │   ├── seed.sql          Sample data
│   │   └── setupDatabase.js  Install logic
│   ├── middleware/           Auth & permissions
│   └── server.js
├── docker-compose.yml        Optional MySQL in Docker
└── README.md
```

---

## Prerequisites

Install on your machine:

1. **Node.js** 18+ — [https://nodejs.org](https://nodejs.org)
2. **MySQL** 8+ — local install **or** Docker (see below)
3. **npm** (comes with Node.js)

---

## Quick start (step by step)

### Step 1 — Clone or open the project

```bash
cd "Drug Store"
```

### Step 2 — Start MySQL

**Option A: Docker MySQL from scratch (recommended)**

1. Start the MySQL container from the project root:

```bash
docker compose up -d
```

2. Wait about 30 seconds for MySQL to be ready.

3. Verify MySQL is running and reachable:

```bash
docker exec -it medicare-mysql mysql -uroot -proot -e "SHOW DATABASES;"
```

4. If you want to connect from your host machine directly, use these settings:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=medicare_drug_store
```

**Option B: Local MySQL**

- Install MySQL 8+
- Start the MySQL service
- Use your local `root` credentials, or create a dedicated MySQL user with full privileges

### Step 3 — Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=medicare_drug_store
JWT_SECRET=change-this-to-a-long-random-string
```

| Variable      | Description                                            |
| ------------- | ------------------------------------------------------ |
| `DB_HOST`     | `localhost` for Docker/MySQL on the same machine       |
| `DB_USER`     | MySQL username (usually `root`)                        |
| `DB_PASSWORD` | MySQL password (`root` for the provided Docker config) |
| `DB_NAME`     | Database name created automatically by install script  |
| `JWT_SECRET`  | Secret for login tokens                                |

### Step 4 — Install backend dependencies

```bash
cd backend
npm install
```

### Step 5 — Start the backend server

```bash
node server.js
```

You should see:

```
Server running on http://localhost:5000
```

Keep this terminal open.

Database initialization

This project no longer exposes an automatic `/install` endpoint. Database schema
creation and seeding must be performed manually or via your deployment tooling
(migrations, CI/CD, or a secure administrative process). Do not expose any
installation endpoints in production.

### Step 7 — Install and start the frontend

Open a **new** terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```
http://localhost:3000/welcome
```

### Step 8 — Sign in

| Role  | Username | Password   | Access                                          |
| ----- | -------- | ---------- | ----------------------------------------------- |
| Admin | `admin`  | `admin123` | Full: add, edit, delete, stock, sales, settings |
| Guest | `guest`  | `guest123` | View only: no add, edit, or delete              |

After login you are redirected to the **Dashboard**.

---

## Database tables (created by schema/migration)

| #   | Table             | Purpose                                      |
| --- | ----------------- | -------------------------------------------- |
| 1   | `users`           | Login accounts (admin / guest)               |
| 2   | `categories`      | Medicine categories (ARV, TB, Malaria, etc.) |
| 3   | `suppliers`       | Pharmaceutical suppliers                     |
| 4   | `medicines`       | Main inventory (1,256 sample rows)           |
| 5   | `stock_movements` | Stock in / stock out history                 |
| 6   | `sales`           | Sales transactions                           |
| 7   | `settings`        | Pharmacy name, currency, alerts              |
| 8   | `notifications`   | Low stock, expiry, system alerts             |

The database schema is created via migrations or the setup scripts. There is no public `/install` endpoint in this repository—do not expose any installer routes in production.

---

## Application pages

| Page          | URL path         | Admin | Guest (view) |
| ------------- | ---------------- | ----- | ------------ |
| Welcome/Login | `/welcome`       | ✓     | ✓            |
| Dashboard     | `/dashboard`     | ✓     | ✓            |
| Inventory     | `/inventory`     | ✓     | ✓            |
| Expiry Alerts | `/expiry-alerts` | ✓     | ✓            |
| Stock In      | `/stock-in`      | ✓     | —            |
| Stock Out     | `/stock-out`     | ✓     | —            |
| Suppliers     | `/suppliers`     | ✓     | ✓ (no edit)  |
| Sales         | `/sales`         | ✓     | —            |
| Categories    | `/categories`    | ✓     | ✓ (no edit)  |
| Reports       | `/reports`       | ✓     | ✓            |
| Settings      | `/settings`      | ✓     | —            |

---

## API overview

Base URL: `http://localhost:5000`

| Method | Endpoint             | Auth     | Description               |
| ------ | -------------------- | -------- | ------------------------- |
| GET    | `/api/health`        | None     | Health check              |
| POST   | `/api/auth/login`    | None     | Login → JWT token         |
| GET    | `/api/dashboard`     | Required | Dashboard analytics       |
| GET    | `/api/inventory`     | Required | Medicine list (paginated) |
| POST   | `/api/inventory`     | Admin    | Add medicine              |
| PUT    | `/api/inventory/:id` | Admin    | Update medicine           |
| DELETE | `/api/inventory/:id` | Admin    | Delete medicine           |
| GET    | `/api/categories`    | Required | Categories                |
| GET    | `/api/suppliers`     | Required | Suppliers                 |
| GET    | `/api/stock`         | Required | Stock movements           |
| POST   | `/api/stock/in`      | Admin    | Stock in                  |
| POST   | `/api/stock/out`     | Admin    | Stock out                 |
| GET    | `/api/sales`         | Required | Sales list                |
| POST   | `/api/sales`         | Admin    | New sale                  |
| GET    | `/api/settings`      | Required | Settings                  |
| PUT    | `/api/settings`      | Admin    | Update settings           |
| GET    | `/api/reports/*`     | Required | Reports                   |

Send token on protected routes:

```
Authorization: Bearer <your-jwt-token>
```

---

## Troubleshooting

### Database connection issues

If the backend reports errors connecting to MySQL:

- Docker: `docker compose up -d` then wait 30s
- Windows: start **MySQL** service in Services
- Check `DB_PASSWORD` in `backend/.env`

### Dashboard shows demo data / install not run

Ensure the backend can reach your database and that the schema has been created.
Use migration tooling or contact your administrator to initialize the database.

### Frontend cannot load data after login

1. Backend must run on port **5000**
2. Frontend proxies `/api` to `http://localhost:5000` (see `frontend/vite.config.js`)
3. Restart backend after changing `.env`

### `401 Login required`

Sign in at `http://localhost:3000/welcome`. Token is stored in browser localStorage.

### Guest cannot edit

Expected. Use **admin** account for changes.

---

## Production notes

- Change `JWT_SECRET` to a strong random value
- Change default passwords `admin123` / `guest123`
  -- Ensure no `/install` or similar endpoints are exposed in production
- Use HTTPS
- Do not commit `backend/.env`

---

## Scripts reference

| Command          | Where    | What it does                                                      |
| ---------------- | -------- | ----------------------------------------------------------------- |
| `node server.js` | backend  | Start API on port 5000                                            |
| `npm run dev`    | backend  | Start API with auto-reload                                        |
| (removed)        | backend  | Database setup handled externally; no CLI installer in production |
| `npm run dev`    | frontend | Start UI on port 3000                                             |
| `npm run build`  | frontend | Production build                                                  |

---

## License

Private / educational project — Hussu Drug Store.
