-- Whop Analytics Dashboard - Supabase Database Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cqruezkmcqwbravslnbe/sql/new

-- ============================================================================
-- TABLES
-- ============================================================================

-- Companies (Whop business owners/creators)
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,                    -- Whop company ID (biz_***)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ,                  -- Last time data was synced from Whop API
  subscription_tier TEXT DEFAULT 'free',  -- free, pro, agency
  is_active BOOLEAN DEFAULT true
);

-- Products (creator's offerings/access passes)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,                    -- Whop product ID (prod_***)
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB                          -- Additional product data
);

-- Memberships (customer subscriptions)
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,                    -- Whop membership ID (mem_***)
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  user_id TEXT,                           -- Whop user ID
  status TEXT,                            -- trialing, active, cancelled, expired, past_due
  valid BOOLEAN,                          -- Is membership currently valid?
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  renewal_period_start TIMESTAMPTZ,
  renewal_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  CONSTRAINT unique_membership UNIQUE (company_id, id)
);

-- Payments (transaction history)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,                    -- Whop payment ID (pay_***)
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  membership_id TEXT,                     -- Reference to membership (may not exist)
  user_id TEXT,                           -- Whop user ID
  status TEXT,                            -- paid, refunded, failed, pending
  final_amount INTEGER,                   -- Amount in cents
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  CONSTRAINT unique_payment UNIQUE (company_id, id)
);

-- Metrics cache (pre-computed metrics for fast loading)
CREATE TABLE IF NOT EXISTS metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,              -- daily_revenue, new_members, churn_rate, etc.
  value NUMERIC,
  metadata JSONB,                         -- Additional metric data
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_metric UNIQUE (company_id, date, metric_type)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_company_date
  ON payments(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_company_status
  ON payments(company_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_paid_at
  ON payments(company_id, paid_at DESC)
  WHERE paid_at IS NOT NULL;

-- Memberships indexes
CREATE INDEX IF NOT EXISTS idx_memberships_company_status
  ON memberships(company_id, status, valid);

CREATE INDEX IF NOT EXISTS idx_memberships_company_user
  ON memberships(company_id, user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_expires_at
  ON memberships(company_id, expires_at)
  WHERE expires_at IS NOT NULL;

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_company
  ON products(company_id);

-- Metrics cache indexes
CREATE INDEX IF NOT EXISTS idx_metrics_cache_lookup
  ON metrics_cache(company_id, date, metric_type);

CREATE INDEX IF NOT EXISTS idx_metrics_cache_date
  ON metrics_cache(company_id, date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (your Next.js app will use service role key)
CREATE POLICY "Service role has full access to companies" ON companies
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to products" ON products
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to memberships" ON memberships
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to payments" ON payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to metrics_cache" ON metrics_cache
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- HELPFUL VIEWS (Optional)
-- ============================================================================

-- View for active memberships
CREATE OR REPLACE VIEW active_memberships AS
SELECT
  m.*,
  p.name as product_name,
  c.subscription_tier
FROM memberships m
LEFT JOIN products p ON m.product_id = p.id
LEFT JOIN companies c ON m.company_id = c.id
WHERE m.valid = true AND m.status IN ('active', 'trialing');

-- View for successful payments
CREATE OR REPLACE VIEW successful_payments AS
SELECT
  p.*,
  pr.name as product_name
FROM payments p
LEFT JOIN products pr ON p.product_id = pr.id
WHERE p.status = 'paid' AND p.paid_at IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================================

-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'products', 'memberships', 'payments', 'metrics_cache')
ORDER BY table_name;

-- Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'products', 'memberships', 'payments', 'metrics_cache')
ORDER BY tablename, indexname;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Verify tables exist using the queries above
-- 2. Test inserting a sample company:
--    INSERT INTO companies (id) VALUES ('biz_test123');
-- 3. Your Next.js app is now ready to sync data from Whop API!
-- ============================================================================
