# 📋 Pre-Deployment Checklist

Complete this before deploying to production. Estimated time: **2-3 hours**

---

## 1. Security Hardening

### Environment Variables

- [ ] Generate strong JWT_SECRET (32+ chars): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Add to Railway secrets (NOT in code)
- [ ] Verify `NODE_ENV=production` in Railway
- [ ] Set `FRONTEND_URL=https://your-domain.vercel.app` in Railway

### Database Security

- [ ] Change default PlanetScale password (auto-generated, but verify)
- [ ] Enable SSL certificate pinning (PlanetScale does this by default)
- [ ] Back up database before going live
- [ ] Test disaster recovery (restore from backup)

### User Credentials

- [ ] **Change default admin password** via app settings
- [ ] Create real user accounts for staff
- [ ] Delete demo/test accounts
- [ ] Verify only admin can access `/api/settings` and delete routes

### API Security

- [ ] Verify CORS is restricted: `FRONTEND_URL=your-vercel-domain`
- [ ] Test rate limiting: Try 100 login attempts (should fail after 5)
- [ ] Verify helmet security headers: `curl -i https://backend/api/health | grep -i x-`
- [ ] Check no sensitive data in error messages (NODE_ENV=production hides details)

---

## 2. Code Review

### Backend

- [ ] `backend/server.js`: Verify `isProduction` checks and error handling
- [ ] `backend/middleware/auth.js`: Verify JWT secret is strong
- [ ] `backend/routes/*.js`: Spot check 2-3 routes for SQL injection (should use `?`)
- [ ] Search for `TODO`, `FIXME`, `DEBUG` comments and remove

### Frontend

- [ ] `frontend/src/api/client.js`: Verify uses `VITE_API_BASE` env var
- [ ] `frontend/.env.production`: Verify correct API URL (not localhost!)
- [ ] Search for `console.log` statements (remove debug logs)
- [ ] Verify no hardcoded backend URLs

### Database

- [ ] `backend/scripts/schema.sql`: Verify all tables have proper indexes
- [ ] Verify foreign key constraints are enabled
- [ ] Backup script exists for production data

---

## 3. Build & Testing

### Frontend Build

```bash
cd frontend
npm install
npm run build
# Should complete without errors
# dist/ should be < 2MB
```

- [ ] Build completes successfully
- [ ] No build warnings (fix any)
- [ ] `.env.production` uses correct API URL

### Backend Startup

```bash
cd backend
npm install
NODE_ENV=production \
DB_HOST=localhost \
DB_USER=root \
DB_PASSWORD=root \
DB_NAME=drug_store \
JWT_SECRET=your-test-secret-123456789012 \
PORT=3001 \
node server.js
```

- [ ] Server starts without errors
- [ ] Env validation passes
- [ ] Health check works: `curl http://localhost:3001/api/health`

### End-to-End Test

- [ ] Start backend + frontend locally
- [ ] Test login: `admin` / `admin123`
- [ ] Add medicine → Verify appears in list
- [ ] Edit medicine → Verify changes saved
- [ ] Delete medicine → Verify removed
- [ ] Test all pages load without 404
- [ ] Test logout → Should clear token

---

## 4. Database

### Schema Validation

```sql
-- In PlanetScale console:
SHOW TABLES;
-- Should have: medicines, categories, suppliers, stock_movements, sales, sales_items, settings, notifications, users

SELECT COUNT(*) FROM medicines;
-- Should have seed data (check with: SELECT COUNT(*) > 0)
```

- [ ] All 8 tables exist
- [ ] Seed data is populated
- [ ] Foreign keys are intact

### Backup Plan

- [ ] Document how to backup: `mysqldump -u user -p database > backup.sql`
- [ ] Test restore from backup on local DB
- [ ] Store backup URLs in password manager
- [ ] Set PlanetScale automated backups (if available on plan)

---

## 5. Deployment

### Railway Backend

1. **Create Railway Account**
   - [ ] Sign up at railway.app

2. **Connect GitHub**
   - [ ] Grant Railway access to your GitHub repo
   - [ ] Select "Drug Store" repo

3. **Configure Environment**

   ```
   NODE_ENV=production
   JWT_SECRET=your-strong-secret-here
   DB_HOST=your-planetscale-host
   DB_USER=username
   DB_PASSWORD=password
   DB_NAME=drug-store
   FRONTEND_URL=https://your-domain.vercel.app
   PORT=3001
   ```

   - [ ] All env vars set
   - [ ] No typos in keys
   - [ ] Secrets don't contain quotes

4. **Deploy**
   - [ ] Click "Deploy" in Railway
   - [ ] Wait for build to complete (5-10 min)
   - [ ] Check logs for errors
   - [ ] Get deployed URL: `https://xxx.railway.app`

5. **Verify Deployment**
   ```bash
   curl https://xxx.railway.app/api/health
   # Should return: {"status":"ok","app":"Hussu Drug Store API"}
   ```

   - [ ] Health endpoint works
   - [ ] No CORS errors in browser console

### PlanetScale Database

1. **Create Account**
   - [ ] Sign up at planetscale.com

2. **Create Database**
   - [ ] Name: `drug-store`
   - [ ] Region: Closest to your users
   - [ ] Get connection string

3. **Initialize Database**
   - [ ] Copy schema.sql to PlanetScale console
   - [ ] Copy seed.sql to PlanetScale console
   - [ ] Verify tables created: `SHOW TABLES;`

4. **Backup Credentials**
   - [ ] Save connection string in password manager
   - [ ] Save username/password securely
   - [ ] Keep backup offline

### Vercel Frontend

1. **Create Vercel Account**
   - [ ] Sign up at vercel.com with GitHub

2. **Import Project**
   - [ ] Click "Import Project"
   - [ ] Select your GitHub repo
   - [ ] Select "Drug Store" (root directory)

3. **Configure Build**
   - [ ] Root Directory: `frontend`
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `dist`
   - [ ] Framework: Vite

4. **Add Environment Variables**

   ```
   VITE_API_BASE=https://your-railway-backend.railway.app/api
   ```

   - [ ] Env var added
   - [ ] No typos in URL

5. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for build (2-3 min)
   - [ ] Get Vercel URL: `https://xxx.vercel.app`
   - [ ] Visit URL and verify app loads

---

## 6. Post-Deployment Verification

### Frontend

```bash
# Visit: https://your-domain.vercel.app
```

- [ ] Page loads without 404
- [ ] Logo/styling appears correct
- [ ] No console errors (F12 → Console tab)
- [ ] API requests show correct URL (F12 → Network tab)

### Backend

```bash
curl -X GET https://your-backend.railway.app/api/health \
  -H "Origin: https://your-frontend.vercel.app"
```

- [ ] Health check returns `{"status":"ok"}`
- [ ] CORS headers present (check response headers)

### Authentication Flow

1. Visit frontend URL
2. Click "Login"
3. Enter: `admin` / `admin123`
4. Check browser Storage (F12 → Application → localStorage):
   - [ ] `medicare_auth_token` contains JWT
   - [ ] `medicare_auth_user` contains user object
5. Navigate to Dashboard
   - [ ] Should load data without 401 errors
   - [ ] Check Network tab: All requests have `Authorization: Bearer` header

### Real User Data

- [ ] Add sample medicines via UI
- [ ] Verify they appear in inventory list
- [ ] Test stock in/out movements
- [ ] Verify reports show new data
- [ ] Check data persists after logout/login

### Monitor Logs

- [ ] Railway: Check application logs for errors
- [ ] PlanetScale: Check query logs for slow queries
- [ ] Vercel: Check build logs and runtime logs

---

## 7. Going Live with Real Users

### Before First User Accesses

- [ ] Change admin password from `admin123` to strong password
- [ ] Create user accounts for staff (don't share `admin`)
- [ ] Disable guest account if not needed
- [ ] Test each user role:
  - [ ] Admin: Can access all features
  - [ ] Guest: Can only view (if enabled)
- [ ] Set up monitoring alerts:
  - [ ] Railway: Alert if CPU > 80%
  - [ ] PlanetScale: Alert if storage > 4GB
  - [ ] Vercel: Alert if build fails

### After First Week

- [ ] Monitor Railway logs for errors
- [ ] Check PlanetScale query performance
- [ ] Verify all features working (ask users for feedback)
- [ ] Check disk space hasn't filled up
- [ ] Test backup/restore procedure works
- [ ] Review any error logs and fix issues

### After First Month

- [ ] Analyze usage patterns (number of daily active users)
- [ ] Check if any queries are slow (PlanetScale analytics)
- [ ] Review cost of free tier (should be ~$0)
- [ ] Plan upgrades if needed (should cost $5-50/month depending on growth)
- [ ] Schedule regular backups

---

## 8. Troubleshooting

### "Frontend shows blank page"

- [ ] Check browser console (F12) for errors
- [ ] Verify `VITE_API_BASE` is correct in Vercel env vars
- [ ] Verify frontend build command ran successfully
- [ ] Clear browser cache (Cmd+Shift+Delete)

### "Login fails / 401 errors"

- [ ] Check `JWT_SECRET` matches between Railway and backend code
- [ ] Verify backend is running: `curl https://backend/api/health`
- [ ] Check CORS origin matches Vercel URL exactly
- [ ] Test login via curl:
  ```bash
  curl -X POST https://backend/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  ```

### "Database connection error"

- [ ] Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` in Railway env vars
- [ ] Test connection string locally:
  ```bash
  mysql -h your-host -u user -p database
  ```
- [ ] Check PlanetScale console shows "Connected"
- [ ] Verify IP whitelist allows Railway (PlanetScale allows all by default)

### "High CPU on Railway"

- [ ] Check if queries are slow (PlanetScale analytics)
- [ ] Add missing database indexes
- [ ] Reduce `connectionLimit` in db.js (too many connections)
- [ ] Clear old sales/stock data (archive to CSV)

### "High storage on PlanetScale"

- [ ] Check if test data is too large: `SELECT COUNT(*) FROM medicines;`
- [ ] Reduce test data size or delete old records
- [ ] Upgrade to PlanetScale Pro tier ($39/month)

---

## 9. Final Checklist

- [ ] All security hardening items completed
- [ ] Environment variables verified
- [ ] Health endpoint responds correctly
- [ ] Login flow works end-to-end
- [ ] All pages load without errors
- [ ] Search/filter/sort works
- [ ] Admin features restricted properly
- [ ] CORS configured to your domain
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Team knows how to access live app
- [ ] Disaster recovery plan documented

---

## Success! 🎉

Your app is now live in production with:

- ✅ Zero downtime deployment
- ✅ Automatic scaling
- ✅ Secure database
- ✅ Real-time monitoring
- ✅ Free (for the first year)

**Important**: Monitor daily for first week, then at least weekly after that.

**Need help?** Check the logs in Railway, PlanetScale, and Vercel dashboards.
