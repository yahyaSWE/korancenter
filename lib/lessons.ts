export type WeeklySlot = { enabled: boolean; time: string } | null | undefined;
export type WeeklySchedule = WeeklySlot[];

export type VirtualLesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  is_cancelled: boolean;
  virtual: true;
  course?: { title: string } | null;
};

/**
 * Generera virtuella lektioner från en kurs weekly_schedule.
 * Schemaindex: 0 = måndag, 6 = söndag (samma som admin-formuläret).
 */
export function expandWeeklySchedule(
  course: {
    id: string;
    title?: string | null;
    weekly_schedule?: WeeklySchedule | null;
    meeting_link?: string | null;
  },
  fromDate: Date,
  toDate: Date,
  limit = 50,
): VirtualLesson[] {
  const schedule = course.weekly_schedule;
  if (!Array.isArray(schedule)) return [];
  if (!schedule.some((s) => s?.enabled && s.time)) return [];

  const out: VirtualLesson[] = [];
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const end = toDate.getTime();
  const oneDay = 86_400_000;

  for (let ms = start.getTime(); ms <= end && out.length < limit; ms += oneDay) {
    const date = new Date(ms);
    const jsDay = date.getDay(); // 0=Sön, 1=Mån
    const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mån, 6=Sön

    const slot = schedule[idx];
    if (!slot?.enabled || !slot.time) continue;

    const [hh, mm] = slot.time.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

    const occur = new Date(date);
    occur.setHours(hh, mm, 0, 0);
    if (occur < fromDate || occur > toDate) continue;

    out.push({
      id: `virtual-${course.id}-${occur.toISOString()}`,
      course_id: course.id,
      title: course.title ?? "Lektion",
      description: null,
      scheduled_at: occur.toISOString(),
      duration_minutes: 60,
      meeting_link: course.meeting_link ?? null,
      is_cancelled: false,
      virtual: true,
      course: course.title ? { title: course.title } : null,
    });
  }

  return out;
}
