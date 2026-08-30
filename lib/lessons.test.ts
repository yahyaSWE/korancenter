import { describe, expect, it } from "vitest";
import { getNextScheduledLesson, type WeeklySchedule } from "./lessons";

function schedule(...slots: Array<[number, string]>): WeeklySchedule {
  const result: WeeklySchedule = Array.from({ length: 7 }, () => ({ enabled: false, time: "18:00" }));
  for (const [dayIndex, time] of slots) result[dayIndex] = { enabled: true, time };
  return result;
}

describe("getNextScheduledLesson", () => {
  it("väljer närmaste kommande kursdag i svensk tid", () => {
    const result = getNextScheduledLesson(
      schedule([0, "18:00"], [2, "17:30"]),
      new Date("2026-08-30T10:00:00Z"), // söndag 12:00 i Stockholm
    );

    expect(result).toEqual({ dateLabel: "måndag 31 augusti", time: "18:00" });
  });

  it("väljer nästa vecka när dagens lektion redan har börjat", () => {
    const result = getNextScheduledLesson(
      schedule([6, "11:30"]),
      new Date("2026-08-30T10:00:00Z"), // söndag 12:00 i Stockholm
    );

    expect(result).toEqual({ dateLabel: "söndag 6 september", time: "11:30" });
  });

  it("hanterar svensk vintertid korrekt", () => {
    const result = getNextScheduledLesson(
      schedule([0, "09:00"]),
      new Date("2026-12-06T22:30:00Z"), // söndag 23:30 i Stockholm
    );

    expect(result).toEqual({ dateLabel: "måndag 7 december", time: "09:00" });
  });

  it("returnerar null när kursen saknar ett aktivt schema", () => {
    expect(getNextScheduledLesson(null)).toBeNull();
    expect(getNextScheduledLesson(schedule())).toBeNull();
  });
});
