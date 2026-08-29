-- Senaste lyckade utskick av en faktisk Stripe-betalningslänk.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN applications.payment_link_sent_at IS
  'Tidpunkt då den senaste Stripe-betalningslänken skickades till den sökande.';
