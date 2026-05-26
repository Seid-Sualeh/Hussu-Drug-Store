# 🚀 Quick Start: Deploy Drug Store in 40 Minutes (Free)

**This is your fastest path to production.** Follow these steps in order.

---

## Step 1: Prepare Code (5 minutes)

We already updated the frontend to use environment variables. Verify:

```bash
# Make sure you're in the project root
cd "c:\Users\pc\Desktop\Drug Store"

# Check frontend API client uses env var
grep "VITE_API_BASE" frontend/src/api/client.js
# Should show: const API_BASE = import.meta.env.VITE_API_BASE || '/api';

# Check production env file exists
cat frontend/.env.production
# Should show: VITE_API_BASE=https://drug-store-api.railway.app/api
```

✅ **Status**: Code is ready for deployment

---

## Step 2: Database Setup (5 minutes)

### Create PlanetScale Account

1. Go to https://planetscale.com → Click **Sign up**
2. Sign in with GitHub (recommended)
3. Create new database:
   - Name: `drug-store`
   - Region: Choose closest to you
   - Click **Create database**

### Get Connection Details

1. In dashboard, click **"Connect"** button
2. Select **Node.js** tab
3. Copy the connection string (looks like):
   ```
   mysql://user:password@host.mysql.planetscale.com/drug-store?ssl={"rejectUnauthorized":true}
   ```

**Save this for later** ↗️

### Initialize Database Schema

1. In PlanetScale, go to **"Console"** (top right)
2. Open `backend/scripts/schema.sql` in your editor
3. Copy ALL the code
4. Paste into PlanetScale console
5. Click **Execute**
6. Verify tables created: `SHOW TABLES;` → Should show 8 tables

**Done!** ✅ Database is ready

---

## Step 3: Backend Deployment (10 minutes)

### Create Railway Account

1. Go to https://railway.app
2. Click **Login** → Choose **GitHub**
3. Authorize Railway to access your repos
4. Click **"New Project"** → **Deploy from GitHub**
5. Select your `Drug Store` repository
6. Select the `backend/` folder as root directory (or select `main` branch and specify root later)

### Configure Environment Variables

In Railway dashboard:

1. Go to **Variables** tab
2. Add these variables:

```
NODE_ENV=production
JWT_SECRET=THIS_IS_A_SUPER_SECRET_KEY_CHANGE_ME_123456789
DB_HOST=your-planetscale-host.mysql.planetscale.com
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=drug-store
FRONTEND_URL=https://your-frontend-will-go-here.vercel.app
PORT=3001
```

**How to get database values:**

- From the PlanetScale connection string you saved, extract:
  - `DB_HOST`: The `host` part
  - `DB_USER`: The `user` part (before `:`)
  - `DB_PASSWORD`: The `password` part (between `:` and `@`)
  - `DB_NAME`: The database name (after `/`)

**JWT_SECRET**: Replace with a random string:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

3. Click **Deploy**
4. Wait 5-10 minutes for build to complete
5. When done, you get a URL like: `https://drug-store-api-production-xxxx.railway.app`

**Save this URL** ↗️

### Test Backend

```bash
# Copy your Railway URL and test:
curl https://your-railway-url.railway.app/api/health
# Should return: {"status":"ok","app":"Hussu Drug Store API"}
```

✅ **Status**: Backend is live!

---

## Step 4: Update Backend CORS (2 minutes)

Go back to Railway dashboard:

1. **Variables** tab
2. Find `FRONTEND_URL`
3. **Replace** with: `https://your-frontend-domain.vercel.app`
   (You'll update this after deploying frontend)

4. Click **Save**

---

## Step 5: Frontend Deployment (15 minutes)

### Create Vercel Account

1. Go to https://vercel.com
2. Click **Sign up** → Choose **GitHub**
3. Authorize Vercel to access your repos
4. Click **"New Project"** → Find your `Drug Store` repo
5. Click **Import**

### Configure Build Settings

1. **Root Directory**: Set to `frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. Framework: Should auto-detect `Vite`

### Add Environment Variable

1. Go to **Environment Variables** section
2. Add:

   ```
   VITE_API_BASE=https://your-railway-backend-url.railway.app/api
   ```

   (Use the Railway URL you saved earlier)

3. Click **Deploy**
4. Wait 2-3 minutes for build
5. When done, you get a Vercel URL like: `https://drug-store-abc123.vercel.app`

### Update Railway CORS

1. Go back to Railway dashboard
2. **Variables** tab
3. Update `FRONTEND_URL` to your Vercel URL
4. Save

✅ **Status**: Frontend is live!

---

## Step 6: Test Everything (5 minutes)

### Open Your App

Visit: `https://your-domain.vercel.app`

You should see the login page. If you see errors:

- Check browser console (F12)
- Check that `VITE_API_BASE` is correct

### Login

Username: `admin`  
Password: `admin123`

You should see the dashboard with empty data.

### Create Test Data

1. Go to **Inventory** → **Add Medicine**
2. Fill in details (name, price, quantity, expiry)
3. Click **Save**
4. Verify medicine appears in list
5. Test **Stock In** → Add 100 units
6. Test **Stock Out** → Remove 10 units
7. Check **Dashboard** → Stats updated

### Test All Pages

- ✅ Dashboard
- ✅ Inventory (add/edit/delete)
- ✅ Categories
- ✅ Suppliers
- ✅ Stock Movements
- ✅ Sales
- ✅ Reports
- ✅ Settings
- ✅ Logout

If all pages work: **You're done!** 🎉

---

## Step 7: Security Before Real Users (5 minutes)

### Change Admin Password

1. Click **Settings** in app
2. Change password from `admin123` to something strong
3. Save

### Create User Accounts

1. If you have staff, ask IT to create accounts (if feature exists)
2. Or only use admin account for now

### Verify Security

```bash
# Test rate limiting:
for i in {1..10}; do
  curl -X POST https://your-backend.railway.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done
# After 5 failed attempts, should get rate limit error
```

✅ **Status**: Your app is production-ready!

---

## Troubleshooting

### "Frontend shows blank page"

1. Press F12 to open Developer Tools
2. Check **Console** tab for red errors
3. Check **Network** tab:
   - Should see API requests to `/api/health`, `/api/auth/me`
   - If getting 404, your `VITE_API_BASE` is wrong

**Fix**: Update `VITE_API_BASE` in Vercel dashboard → Redeploy

### "Cannot login / 401 error"

1. Check Railway logs for errors
2. Verify `JWT_SECRET` is set (not empty)
3. Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct
4. Test database connection:
   ```bash
   mysql -h your-host -u user -p drug-store
   ```

**Fix**: Update Railway env vars → Redeploy

### "Database connection failed"

1. Verify PlanetScale connection string is correct
2. Check if database tables exist: `SHOW TABLES;` in PlanetScale console
3. Verify all 8 tables are created (users, medicines, categories, etc.)

**Fix**: Re-run schema.sql in PlanetScale console

### "High costs / Quota exceeded"

Your free tier should cost **$0** for the first year. If you're seeing charges:

1. Check Railway: Should be free if under 500 build minutes/month
2. Check PlanetScale: Should be free if under 5GB storage
3. Check Vercel: Should be free

**Fix**: Switch to free tier in settings or contact support

---

## What's Next?

### 🔥 Hot Fixes (Do These Soon)

1. **Change JWT_SECRET** to something random (not `THIS_IS_A_SUPER_SECRET_KEY_CHANGE_ME...`)
2. **Change admin password** to something strong
3. **Set up backups** for your database

### 📊 Add Real Data

Test your app with large datasets:

```bash
# Generate 5000 test medicines + 50000 transactions
node backend/scripts/generateTestData.js --medicines 5000 --transactions 50000
```

Then re-test performance. See [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) for details.

### 📈 Monitor Your App

1. **Railway**: Check logs daily for errors
2. **PlanetScale**: Check query performance
3. **Vercel**: Check analytics for frontend speed

### 🚀 Scale When Ready

Your free tier handles **thousands of medicines** and **hundreds of users**. If you grow bigger:

- Upgrade Railway to Pro: $5/month
- Upgrade PlanetScale to Pro: $39/month
- Upgrade Vercel to Pro: $20/month
- Total: ~$64/month for enterprise-grade infrastructure

---

## 📚 Full Guides

Need more details? See:

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed step-by-step (this guide is the summary)
- [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) - Final checklist before going live
- [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) - Test with huge data & optimize

---

## Summary

| Step            | Time        | Platform      | Status       |
| --------------- | ----------- | ------------- | ------------ |
| 1. Prepare Code | 5 min       | Local         | ✅ Done      |
| 2. Database     | 5 min       | PlanetScale   | ✅ Do Now    |
| 3. Backend      | 10 min      | Railway       | ✅ Do Now    |
| 4. CORS         | 2 min       | Railway       | ✅ Do Now    |
| 5. Frontend     | 15 min      | Vercel        | ✅ Do Now    |
| 6. Testing      | 5 min       | Browser       | ✅ Do Now    |
| 7. Security     | 5 min       | App + Railway | ✅ Do Now    |
| **Total**       | **~40 min** | **Free**      | **🎉 Live!** |

---

**You're ready! Start with Step 2 (PlanetScale) right now.** 🚀
