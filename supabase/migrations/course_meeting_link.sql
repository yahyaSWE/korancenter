-- En enda Microsoft Teams-länk per kurs (samma för alla lektioner)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;
