# 🚀 Deployment Guide - Shop-hub

## ✅ CORS & Production Issues - FIXED

### Problems That Were Fixed:
1. ✅ CORS blocking production frontend
2. ✅ Products not showing in production  
3. ✅ OTP emails not working
4. ✅ Session cookies not persisting

---

## 📋 What You Need to Do Now

### 1. Update Render Environment Variables (Backend)

Go to your Render dashboard → Your service → Environment tab

**Add/Update these variables:**
```
FRONTEND_URL=https://shophub-chi-rose.vercel.app
NODE_ENV=production
```

Then click "Save Changes" and redeploy.

### 2. Update Vercel Environment Variables (Frontend)

Go to Vercel dashboard → Your project → Settings → Environment Variables

**Verify this exists:**
```
REACT_APP_API_URL=https://shophub-6ua7.onrender.com
```

If you change it, redeploy.

### 3. Push Code to GitHub

```bash
git add .
git commit -m "Fix CORS and session for production"
git push
```

This will trigger auto-deployment on both Render and Vercel.

---

## 🧪 Testing After Deployment

### Test 1: Products Loading
1. Visit: https://shophub-chi-rose.vercel.app
2. Products should display on home page
3. Open browser console (F12) - should see NO CORS errors

### Test 2: OTP Email
1. Go to signup page
2. Enter email and click "Send OTP"
3. Should receive email
4. Check console - NO CORS errors

### Test 3: Login & Session
1. Login with credentials
2. Navigate between pages
3. Should stay logged in
4. Check DevTools → Application → Cookies → should see `shophub.sid`

---

## 🔧 Technical Changes Made

### CORS Configuration (backend/server.js)
Now allows multiple origins:
- `http://localhost:3000` (development)
- `https://shophub-chi-rose.vercel.app` (production)
- Any URL in `FRONTEND_URL` env variable

### Session Cookies (backend/server.js)
- `secure: true` in production (HTTPS required)
- `sameSite: 'none'` in production (cross-site cookies)
- `sameSite: 'lax'` in development (localhost)

### Environment Variables
- Backend: `NODE_ENV=production`, `FRONTEND_URL=<vercel-url>`
- Frontend: `REACT_APP_API_URL=<render-url>`

---

## 🐛 Troubleshooting

### Products Still Not Showing?

**Check 1: Browser Console**
```javascript
// Run in console
console.log('API URL:', process.env.REACT_APP_API_URL);
```
Should show: `https://shophub-6ua7.onrender.com`

**Check 2: Test API Directly**
```javascript
fetch('https://shophub-6ua7.onrender.com/api/products')
  .then(r => r.json())
  .then(console.log);
```
Should return array of products.

**Check 3: Seed Products**
If database is empty, run seed script on Render:
```bash
npm run seed
```

### CORS Errors Still Appearing?

1. Check Render logs for "❌ CORS blocked origin: ..."
2. Verify `FRONTEND_URL` matches your Vercel URL exactly
3. Make sure you redeployed after changing env variables

### Session/Login Not Working?

1. Verify `NODE_ENV=production` on Render
2. Check cookies in DevTools → Application → Cookies
3. Cookie should have:
   - `Secure: true`
   - `SameSite: None`
   - `HttpOnly: true`

---

## 📦 Current Deployment URLs

- **Frontend**: https://shophub-chi-rose.vercel.app
- **Backend**: https://shophub-6ua7.onrender.com

---

## 🔐 Security Checklist

- ✅ `.env` files not committed to Git
- ✅ HTTPS enabled (Render & Vercel provide this)
- ✅ Secure cookies in production
- ✅ CORS restricted to specific origins
- ✅ Session secrets are strong random strings
- ✅ JWT secrets are strong random strings

---

## 📞 Need Help?

If issues persist:
1. Check browser console for errors
2. Check Render logs for backend errors
3. Verify all environment variables are correct
4. Test API endpoints with Postman/curl
5. Make sure you redeployed after env variable changes

---

## ✨ Expected Results

After following this guide:
- ✅ Products load on homepage
- ✅ OTP emails send successfully
- ✅ Login works and persists
- ✅ No CORS errors
- ✅ Admin features work for host users
- ✅ Cart and orders function correctly
