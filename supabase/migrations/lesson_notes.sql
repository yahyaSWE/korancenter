-- Historik av lärarens anteckningar per elev/kurs — en rad per lektion (append-only)
CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lesson_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,        -- Vad vi gjorde denna lektion / var vi slutade
  homework TEXT,       -- Läxa till nästa gång (syns för eleven)
  notes TEXT,          -- Interna anteckningar (endast lärare)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_student_course ON lesson_notes(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson_date ON lesson_notes(lesson_date DESC);

-- Migrera ev. befintliga student_progress-rader till första historikposten.
-- (student_progress skapas i en tidigare migration; kör denna efter den.)
INSERT INTO lesson_notes (student_id, course_id, teacher_id, lesson_date, summary, homework, notes, created_at)
SELECT student_id, course_id, teacher_id, COALESCE(updated_at::date, CURRENT_DATE),
       last_lesson_summary, homework, next_lesson_notes, COALESCE(updated_at, NOW())
FROM student_progress;
