-- Stripe-fält på courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN NOT NULL DEFAULT true;

-- Stripe-fält på enrollments
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Index för snabb webhook-lookup
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_sub ON enrollments(stripe_subscription_id);
