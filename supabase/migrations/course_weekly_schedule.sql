-- Återkommande veckoschema per kurs (för löpande prenumerationskurser)
-- Format: [{enabled: bool, time: "HH:MM"}] – exakt 7 element, index 0=måndag ... 6=söndag
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS weekly_schedule JSONB;
