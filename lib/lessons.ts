export type WeeklySlot = { enabled: boolean; time: string } | null | undefined;
export type WeeklySchedule = WeeklySlot[];

export type NextScheduledLesson = {
  dateLabel: string;
  time: string;
};

const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";

/**
 * Hitta nästa schemalagda kurstillfälle i svensk lokal tid.
 * Funktionen använder UTC endast som en stabil kalender för datumräkning;
 * själva jämförelsen görs mot klockslaget i Europe/Stockholm.
 */
export function getNextScheduledLesson(
  schedule: WeeklySchedule | null | undefined,
  now = new Date(),
): NextScheduledLesson | null {
  if (!Array.isArray(schedule) || !schedule.some((slot) => slot?.enabled && slot.time)) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("sv-SE-u-ca-gregory", {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const currentMinutes = value("hour") * 60 + value("minute");

  if (![year, month, day, currentMinutes].every(Number.isFinite)) return null;

  for (let offset = 0; offset <= 7; offset += 1) {
    const calendarDate = new Date(Date.UTC(year, month - 1, day + offset, 12));
    const jsDay = calendarDate.getUTCDay(); // 0=Sön, 1=Mån
    const scheduleIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Mån, 6=Sön
    const slot = schedule[scheduleIndex];
    if (!slot?.enabled || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time)) continue;

    const [hours, minutes] = slot.time.split(":").map(Number);
    if (offset === 0 && hours * 60 + minutes <= currentMinutes) continue;

    return {
      dateLabel: new Intl.DateTimeFormat("sv-SE", {
        timeZone: STOCKHOLM_TIME_ZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(calendarDate),
      time: slot.time,
    };
  }

  return null;
}

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
