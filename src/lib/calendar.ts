import { TIMEZONE } from "@/lib/constants";

type Event = { id: string; date: string; startTime: string; endTime: string; reason: string };

const TITLE = "Reservación de la Palapa";
const LOCATION = "Palapa – Área común del residencial";

/** Offset (minutes) of `timeZone` from UTC at the given instant. */
function tzOffsetMinutes(instant: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUTC - instant.getTime()) / 60000;
}

/** Local community date + time -> real UTC instant. */
export function toUtc(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  return new Date(guess.getTime() - tzOffsetMinutes(guess, TIMEZONE) * 60000);
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(e: Event) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${stamp(toUtc(e.date, e.startTime))}/${stamp(toUtc(e.date, e.endTime))}`,
    details: e.reason,
    location: LOCATION,
    ctz: TIMEZONE,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** iCalendar file for Apple Calendar, Outlook, etc. */
export function buildIcs(e: Event) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reserva la Palapa//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@reserva-palapa`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(toUtc(e.date, e.startTime))}`,
    `DTEND:${stamp(toUtc(e.date, e.endTime))}`,
    `SUMMARY:${icsEscape(TITLE)}`,
    `DESCRIPTION:${icsEscape(e.reason)}`,
    `LOCATION:${icsEscape(LOCATION)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(TITLE)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
