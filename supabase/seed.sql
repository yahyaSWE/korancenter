-- ============================================================
-- Korancenter – Exempeldata (Seed)
-- Kör detta i Supabase SQL Editor EFTER schema.sql
-- OBS: Skapa en admin-användare via Supabase Auth först,
--      sätt sedan dess UUID nedan som teacher_id.
-- ============================================================

-- Kurser
INSERT INTO courses (id, title, description, level, price_sek, duration_weeks, sessions_per_week, is_active)
VALUES
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'Nybörjarkurs i Koranen',
    'En introduktionskurs för dig som vill lära dig läsa Koranen från grunden. Vi börjar med det arabiska alfabetet och grundläggande tajwid-regler.',
    'beginner',
    49900,
    12,
    2,
    true
  ),
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'Tajwid – Medelnivå',
    'Fördjupa dina kunskaper i korrekt Koranrecitation. Kursen täcker alla tajwid-regler med praktiska övningar.',
    'intermediate',
    69900,
    16,
    2,
    true
  ),
  (
    'aaaaaaaa-0003-0000-0000-000000000003',
    'Memorering av Juz Amma',
    'Lär dig memorera den 30:e delen av Koranen (Juz Amma) med beprövade memoreringstekniker.',
    'beginner',
    59900,
    20,
    3,
    true
  ),
  (
    'aaaaaaaa-0004-0000-0000-000000000004',
    'Avancerad Koranrecitation',
    'För elever med solid tajwid-grund. Vi arbetar med längre suror och fördjupade recitationsregler.',
    'advanced',
    89900,
    24,
    2,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Lektioner för kurs 1 (Nybörjarkurs)
INSERT INTO lessons (course_id, title, description, scheduled_at, duration_minutes, meeting_link)
VALUES
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'Välkommen & Det arabiska alfabetet – Del 1',
    'Introduktion till kursen och de första 14 bokstäverna i det arabiska alfabetet.',
    NOW() + INTERVAL '2 days',
    60,
    'https://meet.google.com/xxx-yyyy-zzz'
  ),
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'Det arabiska alfabetet – Del 2',
    'De återstående bokstäverna och korta vokaler (harakat).',
    NOW() + INTERVAL '5 days',
    60,
    'https://meet.google.com/xxx-yyyy-zzz'
  ),
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'Sammansättning av bokstäver',
    'Lär dig koppla ihop bokstäver till ord.',
    NOW() + INTERVAL '9 days',
    60,
    'https://meet.google.com/xxx-yyyy-zzz'
  ),
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'Introduktion till Tajwid',
    'Grundläggande tajwid-regler: madd, sukun och shadda.',
    NOW() + INTERVAL '12 days',
    60,
    'https://meet.google.com/xxx-yyyy-zzz'
  ),

-- Lektioner för kurs 2 (Tajwid Medelnivå)
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'Repetition & Introduktion till Noon Sakinah',
    'Genomgång av grunderna och introduktion till Noon Sakinah och Tanwin-regler.',
    NOW() + INTERVAL '1 day',
    75,
    'https://meet.google.com/aaa-bbbb-ccc'
  ),
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'Ikhfa och Idgham',
    'Detaljerad genomgång av Ikhfa och Idgham med praktiska övningar.',
    NOW() + INTERVAL '4 days',
    75,
    'https://meet.google.com/aaa-bbbb-ccc'
  ),
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'Meem Sakinah och Meem Mushaddadah',
    'Regler för Meem Sakinah: Ikhfa Shafawi, Idgham Shafawi och Izhar Shafawi.',
    NOW() + INTERVAL '8 days',
    75,
    'https://meet.google.com/aaa-bbbb-ccc'
  ),

-- Lektioner för kurs 3 (Juz Amma)
  (
    'aaaaaaaa-0003-0000-0000-000000000003',
    'Al-Fatiha & Al-Ikhlas',
    'Memorering och genomgång av Surat Al-Fatiha och Al-Ikhlas.',
    NOW() + INTERVAL '3 days',
    60,
    'https://meet.google.com/ddd-eeee-fff'
  ),
  (
    'aaaaaaaa-0003-0000-0000-000000000003',
    'Al-Falaq & An-Nas',
    'Memorering av de sista surorna i Juz Amma.',
    NOW() + INTERVAL '7 days',
    60,
    'https://meet.google.com/ddd-eeee-fff'
  );

-- Material för kurserna
INSERT INTO materials (course_id, title, type, url)
VALUES
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'Det arabiska alfabetet – Arbetsblad',
    'pdf',
    null
  ),
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'Introduktionsvideo till kursen',
    'video',
    null
  ),
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'Studietips för nybörjare',
    'note',
    null
  ),
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'Tajwid-regler – Komplett guide (PDF)',
    'pdf',
    null
  ),
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'Noon Sakinah – Förklaringsvideo',
    'video',
    null
  ),
  (
    'aaaaaaaa-0003-0000-0000-000000000003',
    'Juz Amma – Recitationsljud',
    'audio',
    null
  ),
  (
    'aaaaaaaa-0003-0000-0000-000000000003',
    'Memoreringstips – Anteckningar',
    'note',
    null
  );
