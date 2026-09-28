import type { Metadata } from "next";
import { AlertTriangle, CalendarDays, Clock, Home, MessageSquareText, Phone, Users, PartyPopper } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import AutoRefresh from "@/components/AutoRefresh";
import ReviewActions from "./ReviewActions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatLongDate, formatShortDate, formatTime, timesOverlap } from "@/lib/format";

export const metadata: Metadata = { title: "Por aprobar" };

export default async function ApproverDashboard() {
  const user = await requireUser(["APPROVER"]);

  const [pending, approved, recent] = await Promise.all([
    prisma.reservation.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, house: true, phone: true, email: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.reservation.findMany({ where: { status: "APPROVED" }, select: { id: true, date: true, startTime: true, endTime: true } }),
    prisma.reservation.findMany({
      where: { reviewedById: user.id },
      include: { user: { select: { name: true, house: true } } },
      orderBy: { reviewedAt: "desc" },
      take: 6,
    }),
  ]);

  // Flag requests that collide with an approved booking or with another pending one.
  const conflictOf = (r: (typeof pending)[number]) => {
    if (approved.some((a) => a.date === r.date && timesOverlap(r.startTime, r.endTime, a.startTime, a.endTime))) return "approved";
    if (pending.some((p) => p.id !== r.id && p.date === r.date && timesOverlap(r.startTime, r.endTime, p.startTime, p.endTime))) return "pending";
    return null;
  };

  return (
    <>
      <AutoRefresh seconds={15} />
      <PageHeader
        title="Solicitudes por aprobar"
        subtitle="Revisa cada solicitud y decide. La lista se actualiza sola cada pocos segundos."
        action={
          <span className="rounded-2xl bg-amber-100 px-5 py-3 text-lg font-extrabold text-amber-900">
            {pending.length} pendiente{pending.length === 1 ? "" : "s"}
          </span>
        }
      />

      {pending.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <PartyPopper className="h-14 w-14 text-brand-500" aria-hidden />
          <p className="mt-4 text-2xl font-extrabold text-stone-900">¡Todo al día!</p>
          <p className="mt-1 text-lg text-stone-600">No hay solicitudes esperando revisión.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {pending.map((r) => {
            const conflict = conflictOf(r);
            return (
              <article key={r.id} className="card flex flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-extrabold text-stone-900">{r.user.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-base text-stone-600">
                      {r.user.house && <span className="flex items-center gap-1"><Home className="h-4 w-4" aria-hidden /> {r.user.house}</span>}
                      {r.user.phone && (
                        <a href={`tel:${r.user.phone}`} className="flex items-center gap-1 underline-offset-2 hover:underline">
                          <Phone className="h-4 w-4" aria-hidden /> {r.user.phone}
                        </a>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="mt-4 space-y-1.5 rounded-2xl bg-stone-50 p-4 text-lg text-stone-800">
                  <p className="flex items-center gap-2 font-bold"><CalendarDays className="h-5 w-5 text-stone-500" aria-hidden /> {formatLongDate(r.date)}</p>
                  <p className="flex items-center gap-2"><Clock className="h-5 w-5 text-stone-400" aria-hidden /> {formatTime(r.startTime)} – {formatTime(r.endTime)}</p>
                  {r.guests && <p className="flex items-center gap-2"><Users className="h-5 w-5 text-stone-400" aria-hidden /> {r.guests} personas</p>}
                  <p className="flex items-start gap-2"><MessageSquareText className="mt-1 h-5 w-5 shrink-0 text-stone-400" aria-hidden /> {r.reason}</p>
                </div>

                {conflict && (
                  <p className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-base font-semibold text-amber-900 ring-1 ring-amber-200">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                    {conflict === "approved"
                      ? "Choca con una reservación ya aprobada. No se podrá aprobar."
                      : "Otra solicitud pendiente pide el mismo horario."}
                  </p>
                )}

                <p className="mt-3 text-sm text-stone-500">Solicitada el {formatDateTime(r.createdAt)}</p>
                <div className="mt-auto pt-4">
                  <ReviewActions id={r.id} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold text-stone-900">Revisadas recientemente por ti</h2>
          <ul className="card mt-4 divide-y divide-stone-100">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-lg">
                <span>
                  <strong>{r.user.name}</strong> <span className="text-stone-500">· {formatShortDate(r.date)}, {formatTime(r.startTime)}</span>
                </span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
