import { AvailabilityPeriod } from "./speedRoundFollowUp";

export function getSlotHour(period: AvailabilityPeriod): number {
  if (period === "morning") {
    return 10;
  }

  if (period === "afternoon") {
    return 14;
  }

  return 18;
}

function getTimeZoneOffsetMilliseconds(timeZone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  );

  return asUtc - date.getTime();
}

export function convertLocalSlotToUtc(dateValue: string, period: AvailabilityPeriod, timeZone: string): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  const hour = getSlotHour(period);
  const utcGuess = Date.UTC(year, month - 1, day, hour, 0, 0);
  const offset = getTimeZoneOffsetMilliseconds(timeZone, new Date(utcGuess));
  return new Date(utcGuess - offset);
}
