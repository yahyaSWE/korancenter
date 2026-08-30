-- Sparar när eleven fick sin inskrivningsbekräftelse efter genomförd betalning.
-- Gör Stripe-webhookens mejlutskick säkert att försöka igen.
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS student_confirmation_sent_at TIMESTAMPTZ;
