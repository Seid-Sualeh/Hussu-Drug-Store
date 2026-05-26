# Performance & Load Testing Guide

## Local Testing with Huge Data

Before deploying to production, test your app with thousands of records to ensure:

- ✅ Database queries are fast
- ✅ Frontend doesn't lag
- ✅ Reports load quickly
- ✅ Search works smoothly

### Option 1: Generate Test Data Locally

```bash
# Generate 5000 medicines + 50000 transactions
node backend/scripts/generateTestData.js --medicines 5000 --transactions 50000

# Or go bigger (if your laptop can handle it)
node backend/scripts/generateTestData.js --medicines 10000 --transactions 100000
```

This script will:

- Create realistic test medicines across all categories
- Generate stock in/out transactions spanning 1 year
- Create sales records with proper relationships
- Insert everything in batches for speed

### Option 2: Load Test via Docker

Use provided `docker-compose.yml` with huge dataset:

```bash
# Terminal 1: Start database + backend
docker-compose up

# Terminal 2: Generate test data in Docker
docker-compose exec backend node scripts/generateTestData.js --medicines 5000

# Terminal 3: Run frontend
cd frontend && npm run dev
```

Then:

1. Login: `admin` / `admin123`
2. Navigate to each page and watch browser DevTools
3. Check query times in backend logs
4. Test searching 10000 medicines
5. Run big reports (expiry, low stock, sales summary)

---

## Database Query Performance

### Check Slow Queries

Add to `backend/config/db.js` to log queries > 1 second:

```javascript
pool.on("connection", (connection) => {
  connection.query('SET SESSION sql_mode="TRADITIONAL"');
  connection.query("SET SESSION max_connections=1000");
});
```

### Verify Indexes

Query should show existing indexes:

```sql
SHOW INDEXES FROM medicines;
SHOW INDEXES FROM stock_movements;
SHOW INDEXES FROM sales;
```

Already indexed:

- `medicines`: id (PRIMARY), category_id, supplier_id
- `stock_movements`: id, medicine_id
- `sales_items`: sale_id, medicine_id

### If Queries Are Slow

Add more indexes:

```sql
-- For filtering/sorting
ALTER TABLE medicines ADD INDEX idx_expiry_date (expiry_date);
ALTER TABLE stock_movements ADD INDEX idx_type_date (type, created_at);
ALTER TABLE sales ADD INDEX idx_created_at (created_at);

-- For joins
ALTER TABLE sales_items ADD INDEX idx_medicine_id (medicine_id);
```

---

## Frontend Performance Optimization

### 1. Check Build Size

```bash
cd frontend && npm run build
# Look for dist/ folder size
```

Should be < 1MB gzipped. If larger, analyze with:

```bash
npm run build -- --analyze
```

### 2. Enable Lazy Loading

Already partially done. For huge data:

```javascript
// In pages/InventoryPage.jsx - add pagination
const ITEMS_PER_PAGE = 50; // Not all 5000 at once

// In components/InventoryTable.jsx
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(50);
```

### 3. Cache Category/Supplier Lists

```javascript
// In AuthContext.jsx
export function useCategories() {
  const [categories, setCategories] = useState(null);
  const cache = useRef({});

  useEffect(() => {
    if (cache.current.categories) {
      setCategories(cache.current.categories);
      return;
    }
    api.getCategories().then((data) => {
      cache.current.categories = data;
      setCategories(data);
    });
  }, []);

  return categories;
}
```

---

## Backend Performance Optimization

### 1. Enable Connection Pooling

Already in `backend/config/db.js`:

```javascript
const pool = mysql.createPool({
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});
```

If you have 1000+ concurrent users, increase to 20-50.

### 2. Add Caching Headers

Update `backend/server.js`:

```javascript
app.get("/api/inventory/categories", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
  // ... rest of handler
});
```

Categories don't change often, so cache them.

### 3. Compress Responses

Already enabled with helmet. Verify:

```bash
curl -i https://drug-store-api.railway.app/api/dashboard
# Look for: Content-Encoding: gzip
```

### 4. Pagination for Large Lists

Already implemented in `backend/routes/inventory.js`:

```javascript
const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
const offset = (page - 1) * limit;
```

Don't ever return all 10000 medicines at once.

---

## Load Testing with Apache Bench

Test concurrent users:

```bash
# Simulate 100 concurrent users, 1000 total requests
ab -n 1000 -c 100 https://drug-store-api.railway.app/api/dashboard

# More detailed:
ab -n 10000 -c 500 -g results.tsv https://drug-store-api.railway.app/api/inventory?limit=50
```

Healthy benchmarks:

- **Response time**: < 200ms average
- **Requests/sec**: > 100
- **Failed requests**: 0
- **95th percentile**: < 500ms

---

## Production Monitoring

### 1. Railway Metrics

- Dashboard → Deployments → Monitor CPU, Memory, Network
- Set alerts if CPU > 80% or Memory > 90%

### 2. Database Monitoring

- PlanetScale → Monitor → Query analytics
- Set alerts if queries > 5s or storage > 4GB (free limit)

### 3. Frontend Monitoring

- Vercel → Analytics → Track performance metrics
- Monitor Core Web Vitals (LCP, FID, CLS)

### 4. Error Tracking

Add to `backend/server.js` for production logging:

```javascript
if (isProduction) {
  app.use((err, req, res, next) => {
    // Send error to logging service (e.g., Sentry, LogRocket)
    console.error("[ERROR]", {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Internal server error" });
  });
}
```

---

## Scaling Checklist

### Before 1000 users:

- ✅ Run generateTestData with 5000 medicines
- ✅ Test all pages load in < 2 seconds
- ✅ Run `ab` test with 100 concurrent users
- ✅ Verify no 500 errors in Railway logs
- ✅ Check database response times in PlanetScale

### If 1000+ users:

- ⬆️ Upgrade Railway to Pro tier ($5/month)
- ⬆️ Upgrade PlanetScale to Pro tier ($39/month)
- 📦 Add Redis caching for categories/suppliers
- 🔄 Implement query result caching
- 📊 Set up real-time monitoring

### If 10000+ users:

- 🎯 Implement read replicas for PlanetScale
- 📈 Move static assets to CDN (Vercel already does this)
- 🗂️ Archive old sales data to S3
- 📡 Use RabbitMQ for async tasks (reports, exports)

---

## Summary

| Scenario         | Setup     | Cost   | Users   | Data                |
| ---------------- | --------- | ------ | ------- | ------------------- |
| Small pharmacy   | Free tier | $0     | < 100   | < 1000 medicines    |
| Medium clinic    | Free tier | $0     | 100-500 | 1000-5000 medicines |
| Hospital network | Pro tiers | $64/mo | 500+    | 10000+ medicines    |

Your free tier is perfect for the **first 2 years** with realistic data.

Start with 1000 medicines and scale as needed! 🚀
