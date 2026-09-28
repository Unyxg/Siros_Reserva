"use client";

import { useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { CalendarCheck, CalendarX2, ChevronLeft, ChevronRight, Clock, Loader2, Send, Users } from "lucide-react";
import { createReservation } from "@/app/actions/reservations";
import { showResult } from "@/components/resultToast";
import { MAX_GUESTS, TIME_OPTIONS } from "@/lib/constants";
import { formatLongDate, formatTime, timesOverlap } from "@/lib/format";

export type BusySlot = { date: string; startTime: string; endTime: string; status: "APPROVED" | "PENDING" };
export type Blocked = { date: string; reason: string };

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function ReservationForm({ today, maxDate, busy, blocked }: { today: string; maxDate: string; busy: BusySlot[]; blocked: Blocked[] }) {
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ year: ty, month: tm - 1 });
  const [date, setDate] = useState<string>("");
  const [startTime, setStart] = useState("");
  const [endTime, setEnd] = useState("");
  const [guests, setGuests] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const busyByDate = useMemo(() => {
    const map = new Map<string, BusySlot[]>();
    for (const b of busy) map.set(b.date, [...(map.get(b.date) ?? []), b]);
    return map;
  }, [busy]);

  const blockedByDate = useMemo(() => new Map(blocked.map((b) => [b.date, b.reason])), [blocked]);

  const dayBusy = (date && busyByDate.get(date)) || [];
  const approvedThatDay = dayBusy.filter((b) => b.status === "APPROVED");
  const isTaken = (start: string, end: string) => approvedThatDay.some((b) => timesOverlap(start, end, b.startTime, b.endTime));

  // Build the month grid (weeks start on Monday)
  const firstWeekday = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const viewKey = `${view.year}-${pad(view.month + 1)}`;
  const canPrev = viewKey > today.slice(0, 7);
  const canNext = viewKey < maxDate.slice(0, 7);

  function shiftMonth(delta: number) {
    setView(({ year, month }) => {
      const m = month + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  function pickDate(d: string) {
    setDate(d);
    setStart("");
    setEnd("");
    // On phones the time picker is below the calendar – bring it into view.
    if (window.innerWidth < 1024) document.getElementById("paso-2")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reset() {
    setDate("");
    setStart("");
    setEnd("");
    setGuests("");
    setReason("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return toast.error("Primero elige un día en el calendario.");
    if (!startTime || !endTime) return toast.error("Elige la hora de inicio y de fin.");

    startTransition(async () => {
      const res = await createReservation({ date, startTime, endTime, guests, reason });
      showResult(res, "Avisar al comité por WhatsApp");
      if (res.ok) reset();
    });
  }

  const endOptions = TIME_OPTIONS.filter((t) => t > startTime);

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-5">
      {/* STEP 1 – calendar */}
      <section className="card p-5 sm:p-6 lg:col-span-3">
        <StepTitle n={1} title="Elige el día" />
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} disabled={!canPrev} className="btn-secondary min-h-11 px-3" aria-label="Mes anterior">
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <p className="text-xl font-extrabold text-stone-900" aria-live="polite">
            {MONTHS[view.month]} {view.year}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={!canNext}
            className="btn-secondary min-h-11 px-3"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-sm font-bold uppercase text-stone-500">{w}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const key = iso(view.year, view.month, d);
            const closed = blockedByDate.get(key);
            const disabled = key < today || key > maxDate || !!closed;
            const slots = busyByDate.get(key) ?? [];
            const hasApproved = slots.some((s) => s.status === "APPROVED");
            const hasPending = slots.some((s) => s.status === "PENDING");
            const selected = key === date;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => pickDate(key)}
                aria-pressed={selected}
                title={closed ? `Cerrado: ${closed}` : undefined}
                aria-label={`${formatLongDate(key)}${closed ? `, cerrado: ${closed}` : hasApproved ? ", tiene reservaciones" : ", libre"}`}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-lg font-bold transition sm:text-xl ${
                  selected
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                    : closed && key >= today
                      ? "cursor-not-allowed bg-stone-200/70 text-stone-400 line-through [background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgba(0,0,0,0.05)_6px_12px)]"
                      : disabled
                      ? "cursor-not-allowed text-stone-300"
                      : hasApproved
                        ? "bg-rose-50 text-rose-900 hover:bg-rose-100"
                        : "bg-stone-50 text-stone-800 hover:bg-brand-50 hover:text-brand-800"
                } ${key === today && !selected ? "ring-2 ring-brand-500" : ""}`}
              >
                {d}
                {!disabled && (hasApproved || hasPending) && (
                  <span className="absolute bottom-1.5 flex gap-1">
                    {hasApproved && <span className={`h-2 w-2 rounded-full ${selected ? "bg-white" : "bg-rose-500"}`} />}
                    {hasPending && <span className={`h-2 w-2 rounded-full ${selected ? "bg-white/70" : "bg-amber-400"}`} />}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-base text-stone-600">
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full ring-2 ring-brand-500" /> Hoy</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-500" /> Ya tiene horario apartado</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" /> Solicitud en revisión</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-stone-300" /> Cerrado</li>
        </ul>

        {blocked.some((b) => b.date.slice(0, 7) === viewKey) && (
          <ul className="mt-4 space-y-1.5 rounded-2xl bg-stone-100 p-4 text-base text-stone-700">
            {blocked
              .filter((b) => b.date.slice(0, 7) === viewKey)
              .map((b) => (
                <li key={b.date} className="flex items-start gap-2">
                  <CalendarX2 className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" aria-hidden />
                  <span><strong>{formatLongDate(b.date)}:</strong> cerrado – {b.reason}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* STEPS 2 & 3 */}
      <section id="paso-2" className="card flex scroll-mt-28 flex-col p-5 sm:p-6 lg:col-span-2">
        <StepTitle n={2} title="Elige el horario" />
        {date ? (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-lg font-bold text-brand-900">
            <CalendarCheck className="h-6 w-6 shrink-0" aria-hidden /> {formatLongDate(date)}
          </p>
        ) : (
          <p className="mt-3 rounded-2xl bg-stone-50 px-4 py-3 text-lg text-stone-500">👈 Toca un día en el calendario.</p>
        )}

        {dayBusy.length > 0 && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-3 text-base">
            <p className="font-bold text-rose-900">Horarios ya ocupados este día:</p>
            <ul className="mt-1 space-y-0.5 text-rose-900">
              {dayBusy.map((b, i) => (
                <li key={i}>
                  • {formatTime(b.startTime)} – {formatTime(b.endTime)}{" "}
                  <span className="text-stone-600">({b.status === "APPROVED" ? "apartado" : "en revisión"})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start" className="label">Desde</label>
            <select id="start" value={startTime} disabled={!date} onChange={(e) => { setStart(e.target.value); setEnd(""); }} className="input">
              <option value="">Hora…</option>
              {TIME_OPTIONS.slice(0, -1).map((t) => (
                <option key={t} value={t} disabled={isTaken(t, TIME_OPTIONS[TIME_OPTIONS.indexOf(t) + 1])}>{formatTime(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="end" className="label">Hasta</label>
            <select id="end" value={endTime} disabled={!startTime} onChange={(e) => setEnd(e.target.value)} className="input">
              <option value="">Hora…</option>
              {endOptions.map((t) => (
                <option key={t} value={t} disabled={isTaken(startTime, t)}>{formatTime(t)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <StepTitle n={3} title="Cuéntanos del evento" />
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="guests" className="label flex items-center gap-2">
              <Users className="h-5 w-5 text-stone-500" aria-hidden /> ¿Cuántas personas?
            </label>
            <input id="guests" type="number" inputMode="numeric" min={1} max={MAX_GUESTS} required value={guests} onChange={(e) => setGuests(e.target.value)} className="input" placeholder="Ej. 15" />
          </div>
          <div>
            <label htmlFor="reason" className="label">Motivo</label>
            <textarea id="reason" rows={3} required maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} className="input resize-none" placeholder="Ej. Cumpleaños de mi hijo, reunión familiar…" />
          </div>
        </div>

        <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
          {pending ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Send className="h-6 w-6" aria-hidden />}
          {pending ? "Enviando…" : "Enviar solicitud"}
        </button>
        <p className="mt-3 flex items-start gap-2 text-base text-stone-500">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> Un aprobador revisará tu solicitud. Verás la respuesta abajo en “Mis solicitudes”.
        </p>
      </section>
    </form>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-extrabold text-stone-900">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-lg text-white">{n}</span>
      {title}
    </h2>
  );
}
