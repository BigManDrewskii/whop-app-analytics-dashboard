# Whop Analytics Dashboard - Complete Setup Guide

This guide will help you complete the setup of your Whop Analytics Dashboard and verify that everything is working correctly.

## ✅ Prerequisites

Before you begin, make sure you have:

- [x] Node.js 20+ installed
- [x] Supabase project created: https://supabase.com
- [x] Whop account and app created: https://whop.com/apps
- [x] Database schema executed in Supabase
- [x] Environment variables configured in `.env`

## 📋 Table of Contents

1. [Verify Database Setup](#1-verify-database-setup)
2. [Configure Whop Webhooks](#2-configure-whop-webhooks)
3. [Create Test Products](#3-create-test-products)
4. [Make Test Purchases](#4-make-test-purchases)
5. [Verify Data Flow](#5-verify-data-flow)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Verify Database Setup

### Check Tables Exist

1. Go to your Supabase project SQL Editor:
   ```
   https://app.supabase.com/project/cqruezkmcqwbravslnbe/sql/new
   ```

2. Run this query to verify all tables were created:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('companies', 'products', 'memberships', 'payments', 'metrics_cache')
   ORDER BY table_name;
   ```

3. You should see 5 tables:
   - ✅ companies
   - ✅ memberships
   - ✅ metrics_cache
   - ✅ payments
   - ✅ products

### Insert Test Company (Optional)

If your company doesn't exist in the database yet:

```sql
INSERT INTO companies (id)
VALUES ('biz_5I0ycVO1857oWD')
ON CONFLICT (id) DO NOTHING;
```

---

## 2. Configure Whop Webhooks

Webhooks allow your dashboard to update in real-time when payments or memberships change.

### Get Your Webhook URL

Your webhook endpoint is:
```
https://your-app-domain.com/api/webhooks/whop
```

For local development with `whop-proxy`:
```
http://localhost:3000/api/webhooks/whop
```

### Set Up Webhooks in Whop Dashboard

1. **Go to Whop Developer Dashboard:**
   ```
   https://whop.com/apps
   ```

2. **Select your app** (Analytics Dashboard)

3. **Navigate to "Webhooks" section**

4. **Add a new webhook endpoint:**
   - URL: `https://your-app-domain.com/api/webhooks/whop`
   - Events to subscribe to:
     - ✅ `payment.succeeded`
     - ✅ `payment.failed`
     - ✅ `payment.refunded`
     - ✅ `membership.created`
     - ✅ `membership.updated`
     - ✅ `membership.cancelled`
     - ✅ `membership.expired`

5. **Copy the Webhook Secret** (you'll need this later)

6. **Save the webhook**

### Add Webhook Secret to Environment Variables

Add to your `.env` file:
```bash
WHOP_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx
```

**Note:** The webhook handler currently accepts all webhooks without signature verification. To enable signature verification, uncomment the verification code in `src/app/(whop-api)/api/webhooks/whop/route.ts`

### Test Webhook (Optional)

Send a test event to verify your webhook is working:

```bash
curl -X POST http://localhost:3000/api/webhooks/whop \
  -H "Content-Type: application/json" \
  -H "x-whop-signature: test" \
  -d '{
    "type": "payment.succeeded",
    "data": {
      "company": {
        "id": "biz_5I0ycVO1857oWD"
      }
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook processed",
  "eventType": "payment.succeeded"
}
```

---

## 3. Create Test Products

To see data in your dashboard, you need products (access passes) with pricing.

### Using Whop Dashboard (Recommended)

1. **Go to your Whop company dashboard:**
   ```
   https://whop.com/hub/biz_5I0ycVO1857oWD
   ```

2. **Navigate to "Products" → "Access Passes"**

3. **Create a new access pass:**
   - **Name:** "Premium Membership"
   - **Type:** Choose "Subscription" or "One-time"
   - **Price:** $9.99 (or any amount)
   - **Billing Period:** Monthly (if subscription)
   - **Stock:** Unlimited
   - **Visibility:** Visible

4. **Save the product**

5. **Get the checkout link:**
   - Click on the product
   - Copy the checkout URL (starts with `https://whop.com/`)

### Create Multiple Products (Optional)

Create different products to test:
- **Basic Plan:** $4.99/month
- **Premium Plan:** $9.99/month
- **Pro Plan:** $19.99/month
- **One-time Course:** $49.99 one-time

---

## 4. Make Test Purchases

### Option 1: Test Mode Purchase (Whop Dashboard)

1. Go to your product's checkout link
2. Use Whop's test mode to make a purchase
3. Use test card: `4242 4242 4242 4242`
4. Any future expiry date
5. Any CVC

### Option 2: Real Purchase (Small Amount)

Make a small real purchase to test the full flow:
1. Use the checkout link for a $0.99 product
2. Complete the real payment
3. Verify webhook is triggered
4. Check dashboard updates

### Option 3: Simulate Webhook Manually

Send a manual webhook event:

```bash
curl -X POST http://localhost:3000/api/webhooks/whop \
  -H "Content-Type: application/json" \
  -H "x-whop-signature: test" \
  -d '{
    "type": "payment.succeeded",
    "data": {
      "id": "pay_test123",
      "company": {
        "id": "biz_5I0ycVO1857oWD"
      },
      "amount": 999,
      "currency": "usd",
      "status": "succeeded",
      "member": {
        "user": {
          "id": "user_test123"
        }
      },
      "accessPass": {
        "id": "prod_test123",
        "name": "Premium Membership"
      }
    }
  }'
```

---

## 5. Verify Data Flow

### Check Dashboard

1. **Open your analytics dashboard:**
   ```
   http://localhost:3000/experiences/exp_OwYC7DUWv3ol0Y
   ```

2. **Verify metrics are showing:**
   - ✅ Total Revenue (should show > $0)
   - ✅ Active Members (should show member count)
   - ✅ Revenue Chart (should show payment data)
   - ✅ Top Products (should show your products)

### Check Supabase Database

Verify data was synced to Supabase:

```sql
-- Check payments
SELECT * FROM payments
WHERE company_id = 'biz_5I0ycVO1857oWD'
ORDER BY created_at DESC
LIMIT 10;

-- Check memberships
SELECT * FROM memberships
WHERE company_id = 'biz_5I0ycVO1857oWD'
ORDER BY created_at DESC
LIMIT 10;

-- Check products
SELECT * FROM products
WHERE company_id = 'biz_5I0ycVO1857oWD';

-- Check last sync time
SELECT id, last_sync
FROM companies
WHERE id = 'biz_5I0ycVO1857oWD';
```

### Check Console Logs

Look for sync logs in your terminal:

```
[SYNC] Starting sync for company: biz_5I0ycVO1857oWD
[SYNC] Fetched from Whop API:
  - 5 payments
  - 8 memberships
  - 3 products
[SYNC] Sync completed successfully in 1234ms
```

---

## 6. Troubleshooting

### Issue: Dashboard shows $0 revenue

**Cause:** No payments in Whop account

**Solution:**
1. Verify products exist in Whop dashboard
2. Make a test purchase or simulate webhook
3. Check Supabase `payments` table for records
4. Force refresh dashboard

### Issue: "Failed to load analytics data"

**Causes:**
- Supabase connection issue
- Environment variables missing
- Database tables not created

**Solutions:**

1. **Check environment variables:**
   ```bash
   # Verify these exist in .env
   NEXT_PUBLIC_SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   WHOP_API_KEY=
   NEXT_PUBLIC_WHOP_COMPANY_ID=
   ```

2. **Verify Supabase connection:**
   - Go to Supabase project settings
   - Copy correct URL and service role key
   - Update `.env` file

3. **Re-run database schema:**
   - Copy contents of `supabase-schema.sql`
   - Run in Supabase SQL Editor
   - Verify tables exist

### Issue: Webhook not triggering

**Causes:**
- Webhook URL incorrect
- Local development not accessible
- Webhook secret mismatch

**Solutions:**

1. **For local development:**
   - Use ngrok or similar to expose localhost:
     ```bash
     ngrok http 3000
     ```
   - Update webhook URL in Whop dashboard

2. **Verify webhook endpoint works:**
   ```bash
   curl http://localhost:3000/api/webhooks/whop
   ```
   Should return:
   ```json
   {
     "message": "Whop webhook endpoint",
     "status": "active"
   }
   ```

3. **Check webhook logs in Whop dashboard**

### Issue: Data not syncing

**Causes:**
- API key invalid
- Company ID wrong
- Sync cache preventing updates

**Solutions:**

1. **Verify API key has permissions:**
   - Go to Whop developer dashboard
   - Check API key permissions
   - Regenerate if needed

2. **Force sync:**
   ```typescript
   // In your code or via API
   await syncCompanyData({
     companyId: 'biz_5I0ycVO1857oWD',
     force: true
   })
   ```

3. **Clear sync cache:**
   ```sql
   UPDATE companies
   SET last_sync = NULL
   WHERE id = 'biz_5I0ycVO1857oWD';
   ```

### Issue: Error boundary showing

**Cause:** JavaScript error in dashboard component

**Solution:**
1. Check browser console for errors
2. Verify all data is properly formatted
3. Check for null/undefined access
4. Click "Reload Dashboard" button

### Still Having Issues?

1. **Check browser console** for JavaScript errors
2. **Check server logs** in terminal for backend errors
3. **Verify Whop API status:** https://status.whop.com
4. **Check Supabase status:** https://status.supabase.com

---

## 🎉 Success Checklist

- [ ] Database tables created in Supabase
- [ ] Environment variables configured
- [ ] Webhook endpoint configured in Whop
- [ ] Test products created
- [ ] Test purchase completed
- [ ] Dashboard showing real data
- [ ] Revenue chart populated
- [ ] Top products showing
- [ ] Customer segmentation working
- [ ] Export to CSV working

---

## 🚀 Next Steps

Once everything is working:

1. **Customize branding** in dashboard UI
2. **Add more products** to your Whop store
3. **Configure alerts** for key metrics
4. **Set up monitoring** (Sentry, LogRocket, etc.)
5. **Deploy to production** (Vercel, Netlify, etc.)
6. **Set up SSL** for webhook endpoint
7. **Enable signature verification** in webhook handler

---

## 📚 Additional Resources

- **Whop API Docs:** https://docs.whop.com/api-reference
- **Whop SDK Docs:** https://docs.whop.com/apps/api/getting-started
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## 🆘 Support

If you need help:

1. Check the [Troubleshooting](#6-troubleshooting) section
2. Review Whop API documentation
3. Check Supabase logs
4. Open an issue on GitHub
5. Contact Whop support

---

**Last Updated:** October 24, 2025
