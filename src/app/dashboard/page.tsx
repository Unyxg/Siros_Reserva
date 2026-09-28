import type { Metadata } from "next";
import { CalendarDays, Clock, MessageSquareText, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import AutoRefresh from "@/components/AutoRefresh";
import AddToCalendar from "@/components/AddToCalendar";
import ReservationForm, { type BusySlot } from "./_components/ReservationForm";
import CancelButton from "./_components/CancelButton";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addDaysISO, formatLongDate, formatTime, todayISO } from "@/lib/format";
import { MAX_DAYS_AHEAD } from "@/lib/constants";

export const metadata: Metadata = { title: "Reservar" };

export default async function ResidentDashboard() {
  const user = await requireUser();
  const today = todayISO();
  const maxDate = addDaysISO(today, MAX_DAYS_AHEAD);

  const [busyRaw, mine, blocked] = await Promise.all([
    // Only times and status are shared with the calendar – never who booked or why.
    prisma.reservation.findMany({
      where: { date: { gte: today, lte: maxDate }, status: { in: ["APPROVED", "PENDING"] } },
      select: { date: true, startTime: true, endTime: true, status: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.reservation.findMany({ where: { userId: user.id }, orderBy: [{ date: "desc" }, { startTime: "desc" }] }),
    prisma.blockedDate.findMany({ where: { date: { gte: today, lte: maxDate } }, select: { date: true, reason: true }, orderBy: { date: "asc" } }),
  ]);

  const upcoming = mine.filter((r) => r.date >= today).reverse();
  const past = mine.filter((r) => r.date < today);
  const firstName = (user.name ?? "").split(" ")[0];

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader
        title={`¡Hola, ${firstName}! 🌴`}
        subtitle="Aparta la Palapa en 3 pasos: elige el día, el horario y cuéntanos de tu evento."
      />

      <ReservationForm today={today} maxDate={maxDate} busy={busyRaw as BusySlot[]} blocked={blocked} />

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-stone-900">Mis solicitudes</h2>
        <p className="mt-1 text-lg text-stone-600">Aquí verás si tu solicitud fue aprobada o rechazada.</p>

        {mine.length === 0 ? (
          <div className="card mt-5 p-10 text-center text-lg text-stone-500">
            Aún no has hecho ninguna solicitud. ¡Elige un día arriba para empezar!
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {upcoming.map((r) => (
                  <ReservationCard key={r.id} r={r} upcoming />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <details className="mt-8 group">
                <summary className="cursor-pointer text-lg font-bold text-stone-700 hover:text-stone-900">
                  Ver solicitudes anteriores ({past.length})
                </summary>
                <div className="mt-4 grid gap-4 opacity-80 md:grid-cols-2">
                  {past.map((r) => (
                    <ReservationCard key={r.id} r={r} upcoming={false} />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </section>
    </>
  );
}

type Row = Awaited<ReturnType<typeof prisma.reservation.findMany>>[number];

function ReservationCard({ r, upcoming }: { r: Row; upcoming: boolean }) {
  const canCancel = upcoming && (r.status === "PENDING" || r.status === "APPROVED");
  const accent =
    r.status === "APPROVED" ? "border-l-emerald-500" : r.status === "PENDING" ? "border-l-amber-400" : r.status === "REJECTED" ? "border-l-rose-500" : "border-l-stone-300";
  return (
    <article className={`card border-l-8 p-5 ${accent}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-lg font-extrabold text-stone-900">
          <CalendarDays className="h-5 w-5 text-stone-500" aria-hidden /> {formatLongDate(r.date)}
        </p>
        <StatusBadge status={r.status} />
      </div>
      <div className="mt-3 space-y-1.5 text-lg text-stone-700">
        <p className="flex items-center gap-2"><Clock className="h-5 w-5 text-stone-400" aria-hidden /> {formatTime(r.startTime)} – {formatTime(r.endTime)}</p>
        {r.guests && <p className="flex items-center gap-2"><Users className="h-5 w-5 text-stone-400" aria-hidden /> {r.guests} personas</p>}
        <p className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-stone-400" aria-hidden /> {r.reason}</p>
      </div>
      {r.reviewNote && (
        <p className={`mt-3 rounded-2xl px-4 py-2.5 text-base ${r.status === "REJECTED" ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900"}`}>
          <strong>Comentario del comité:</strong> {r.reviewNote}
        </p>
      )}
      {r.cancelReason && (
        <p className="mt-3 rounded-2xl bg-stone-100 px-4 py-2.5 text-base text-stone-800">
          <strong>Motivo de la cancelación:</strong> {r.cancelReason}
        </p>
      )}
      {(canCancel || (upcoming && r.status === "APPROVED")) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {upcoming && r.status === "APPROVED" ? <AddToCalendar r={r} /> : <span />}
          {canCancel && <CancelButton id={r.id} approved={r.status === "APPROVED"} />}
        </div>
      )}
    </article>
  );
}
