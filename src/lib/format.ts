import { TIMEZONE } from "@/lib/constants";

/** Today's date as "YYYY-MM-DD" in the community's timezone. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  // Noon UTC keeps the calendar day stable in any timezone.
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** "sábado, 4 de octubre de 2026" */
export function formatLongDate(iso: string) {
  const s = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseISODate(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "4 oct" */
export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" }).format(parseISODate(iso));
}

/** "14:00" -> "2:00 p. m." (easier to read for everyone) */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIMEZONE,
  }).format(date);
}

export function addDaysISO(iso: string, days: number) {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** True when two HH:mm ranges overlap. */
export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}
