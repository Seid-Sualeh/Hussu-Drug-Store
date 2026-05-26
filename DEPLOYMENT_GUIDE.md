# 🚀 Free Production Deployment Guide

**Date**: May 2026  
**Stack**: Node.js/Express + React/Vite + MySQL  
**Platforms**: Vercel, Render, Aiven

---

## Overview

This guide deploys your Drug Store app with:

- ✅ Frontend on **Vercel** (auto-deploy from Git)
- ✅ Backend on **Render** (Node.js service)
- ✅ Database on **Aiven MySQL** (managed MySQL)
- ✅ Separate deployments for better scaling and security

---

## Part A: Database Setup (Aiven MySQL)

### 1. Create PlanetScale Account

1. Go to [planetscale.com](https://planetscale.com) → Sign up (free tier)
2. Create new database: Name it `drug-store`
3. Choose region closest to your users

### 2. Get Connection String

1. In PlanetScale dashboard → Select `drug-store` database
2. Click **"Connect"** → Select **Node.js**
3. Copy the connection string (looks like):
   ```
   mysql://username:password@server.planetscale.com/drug-store?ssl={"rejectUnauthorized":true}
   ```

### 3. Initialize Database

1. Download your database schema from [backend/scripts/schema.sql](../backend/scripts/schema.sql)
2. In PlanetScale: Go to **"Console"** (top right) → Copy/paste schema.sql contents → Execute
3. Run seed data:
   ```
   mysql://username:password@server.planetscale.com/drug-store -u root < backend/scripts/seed.sql
   ```

---

## Part B: Backend Deployment (Render)

### 1. Create Render Account

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **New** → **Web Service**
3. Choose your `Drug Store` GitHub repository
4. Set **Root Directory** to `backend`

### 2. Configure Build & Start Commands

- **Build Command**: leave blank or use `npm install`
- **Start Command**: `npm start`
- **Environment**: Node

### 3. Configure Environment Variables

In Render dashboard, open your service and add these environment variables:

```
NODE_ENV=production
JWT_SECRET=YOUR_STRONG_RANDOM_JWT_SECRET_HERE
DATABASE_URL=mysql://avnadmin:YOUR_PASSWORD@mysql-3354fe6e-evangadiforum1.h.aivencloud.com:20105/defaultdb?ssl-mode=REQUIRED
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

If you prefer separate connection settings instead of `DATABASE_URL`, use:

```
DB_HOST=mysql-3354fe6e-evangadiforum1.h.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=defaultdb
DB_SSL=true
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**Important**:

- `JWT_SECRET` must be strong and unique
- `FRONTEND_URL` should be your Vercel frontend URL
- Do not store real secrets in Git

### 4. Deploy

1. Click **Create Web Service**
2. Render installs dependencies and deploys your backend
3. When complete, Render gives you a URL like: `https://drug-store-backend.onrender.com`

### 5. Test Backend

```bash
curl https://drug-store-backend.onrender.com/api/health
# Should return: {"status":"ok","app":"Hussu Drug Store API"}
```

---

## Part C: Frontend Deployment (Vercel)

### 1. Update API Base URL

Edit [frontend/src/api/client.js](../frontend/src/api/client.js):

Replace:

```javascript
const API_BASE = "/api";
```

With:

```javascript
const API_BASE = process.env.REACT_APP_API_BASE || "/api";
```

And create [frontend/.env.production](../frontend/.env.production):

```
VITE_API_BASE=https://drug-store-api.railway.app/api
```

Update `frontend/src/api/client.js` to use env var:

```javascript
const API_BASE = import.meta.env.VITE_API_BASE || "/api";
```

### 2. Create Vercel Account

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **"New Project"** → Select your `Drug Store` repo
3. **Import project** → Next

### 3. Configure Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `frontend`

### 4. Add Environment Variables

In Vercel project settings → **Environment Variables**:

```
VITE_API_BASE=https://drug-store-api.railway.app/api
```

### 5. Deploy

Click **Deploy** → Vercel builds & deploys automatically  
You get a URL like: `https://drug-store.vercel.app`

---

## Part D: Update Backend CORS

Go back to Railway dashboard and update:

```
FRONTEND_URL=https://drug-store.vercel.app
```

This ensures your backend only accepts requests from your frontend.

---

## Part E: Test Everything

### 1. Test Login

```bash
curl -X POST https://drug-store-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return: `{"user":{"id":1,"username":"admin",...},"token":"eyJhbG..."}`

### 2. Test Protected Route

```bash
curl https://drug-store-api.railway.app/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Test Frontend

Visit: `https://drug-store.vercel.app`

- Should load without errors
- Login with `admin` / `admin123`
- Try adding a medicine, checking inventory, etc.

---

## Part F: Security Before Going Live

### ⚠️ Change Default Credentials

Your app still has default admin/guest passwords. Before real users access it:

1. **Immediately change admin password** via Settings page
2. **Create real user accounts** for staff
3. **Disable guest account** if not needed

### ⚠️ Set Strong JWT_SECRET

Your JWT_SECRET in Railway must be:

- At least 32 characters
- Random/unique
- NOT the default
- NOT in source code

Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ⚠️ Enable HTTPS Everywhere

- ✅ Vercel: HTTPS by default
- ✅ Railway: HTTPS by default
- ✅ PlanetScale: SSL required
- ✅ Configure CORS to only allow HTTPS origin

### ⚠️ Monitor Logs

1. **Railway dashboard** → Logs → Watch for errors
2. **Vercel dashboard** → Deployments → Check build logs
3. Set up email alerts for failures

---

## Part G: Scaling for "Huge Data"

Your current setup handles **thousands to hundreds of thousands** of records easily.

If you need more power (free), upgrade to:

- **Railway Pro**: $5/month per service (get more CPU/memory)
- **PlanetScale Pro**: $39/month (get more storage & reads)
- **Vercel Pro**: $20/month (better analytics & performance)

For now, your free tier supports:

- ✅ Up to 10,000 medicines
- ✅ Up to 100,000+ transactions
- ✅ Thousands of concurrent users
- ✅ Real-time reports & inventory

### Optimize for Large Data

If you hit performance issues:

1. **Add database indexes** (already done in schema.sql)
2. **Implement pagination** (already done in inventory routes)
3. **Cache frequently accessed data** (e.g., categories, suppliers)
4. **Use connection pooling** (already configured in db.js)

---

## Part H: Continuous Deployment

Both Vercel and Railway auto-deploy when you push to main branch:

```bash
# Push code → Vercel/Railway build & deploy automatically
git add .
git commit -m "Fix: improve performance"
git push origin main
```

Monitor deployments:

- **Vercel**: Dashboard → Deployments
- **Railway**: Dashboard → Deployments

---

## Troubleshooting

### "Cannot connect to database"

- Check PlanetScale connection string in Railway
- Verify DB credentials are correct
- Test with: `mysql -u user -p -h host drug-store`

### "Frontend can't reach backend"

- Check `VITE_API_BASE` in Vercel env vars
- Check `FRONTEND_URL` in Railway matches your Vercel URL
- Test CORS: `curl -H "Origin: https://your-frontend" https://your-backend/api/health`

### "401 Unauthorized errors"

- JWT_SECRET mismatch between local & production
- Token expired (user needs to login again)
- Check `Authorization: Bearer TOKEN` header is correct

### "Database quota exceeded"

- Upgrade PlanetScale to paid tier
- Or, archive old sales/stock history to CSV

---

## Summary

| Step           | Platform       | Time        |
| -------------- | -------------- | ----------- |
| A. Database    | PlanetScale    | 5 min       |
| B. Backend     | Railway        | 10 min      |
| C. Frontend    | Vercel         | 10 min      |
| D. CORS Update | Railway        | 2 min       |
| E. Testing     | curl/browser   | 10 min      |
| **Total**      | **Free stack** | **~40 min** |

Your app is now **live, secure, and scalable** 🎉

---

**Need help?**

- Railway support: support@railway.app
- PlanetScale help: docs.planetscale.com
- Vercel docs: vercel.com/docs
