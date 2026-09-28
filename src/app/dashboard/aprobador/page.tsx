import type { Metadata } from "next";
import { AlertTriangle, CalendarDays, CalendarX2, Clock, Home, MessageSquareText, Phone, Users, PartyPopper } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import AutoRefresh from "@/components/AutoRefresh";
import WhatsAppButton from "@/components/WhatsAppButton";
import ReviewActions from "./ReviewActions";
import StaffCancelButton from "./StaffCancelButton";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { reservationWhatsappMessage, whatsappLink } from "@/lib/whatsapp";
import { addDaysISO, formatDateTime, formatLongDate, formatShortDate, formatTime, timesOverlap, todayISO } from "@/lib/format";

export const metadata: Metadata = { title: "Por aprobar" };

const owner = { select: { name: true, house: true, phone: true } } as const;

export default async function ApproverDashboard() {
  await requireUser(["APPROVER", "ADMIN"]);
  const today = todayISO();

  const [pending, approved, recent, blocked] = await Promise.all([
    prisma.reservation.findMany({ where: { status: "PENDING" }, include: { user: owner }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.reservation.findMany({ where: { status: "APPROVED", date: { gte: today } }, include: { user: owner }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.reservation.findMany({
      where: { status: { in: ["APPROVED", "REJECTED", "CANCELLED"] }, updatedAt: { gte: new Date(`${addDaysISO(today, -14)}T00:00:00Z`) } },
      include: { user: owner, reviewedBy: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.blockedDate.findMany({ where: { date: { gte: today } } }),
  ]);

  const blockedMap = new Map(blocked.map((b) => [b.date, b.reason]));

  // Flag requests that collide with an approved booking, a blocked day, or another pending one.
  const conflictOf = (r: (typeof pending)[number]) => {
    if (blockedMap.has(r.date)) return `Ese día está cerrado (${blockedMap.get(r.date)}). No se podrá aprobar.`;
    if (approved.some((a) => a.date === r.date && timesOverlap(r.startTime, r.endTime, a.startTime, a.endTime)))
      return "Choca con una reservación ya aprobada. No se podrá aprobar.";
    if (pending.some((p) => p.id !== r.id && p.date === r.date && timesOverlap(r.startTime, r.endTime, p.startTime, p.endTime)))
      return "Otra solicitud pendiente pide el mismo horario.";
    return null;
  };

  return (
    <>
      <AutoRefresh seconds={15} />
      <PageHeader
        title="Solicitudes por aprobar"
        subtitle="Revisa cada solicitud y decide. Después toca el botón verde para avisarle al vecino por WhatsApp."
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
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> {conflict}
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
          <h2 className="text-2xl font-extrabold text-stone-900">Revisadas recientemente</h2>
          <p className="mt-1 text-lg text-stone-600">Toca el botón verde para mandarle la respuesta al vecino por WhatsApp.</p>
          <ul className="card mt-4 divide-y divide-stone-100">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-lg">
                <span className="min-w-0">
                  <strong>{r.user.name}</strong> <span className="text-stone-500">· {formatShortDate(r.date)}, {formatTime(r.startTime)}</span>
                  {r.reviewedBy && <span className="block text-sm text-stone-500">Revisó: {r.reviewedBy.name}</span>}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={r.status} />
                  <WhatsAppButton compact label="WhatsApp" href={whatsappLink(r.user.phone, reservationWhatsappMessage(r.user.name, r))} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-stone-900">Próximos eventos aprobados</h2>
        <p className="mt-1 text-lg text-stone-600">Si surge un imprevisto, puedes cancelar una reservación para liberar el horario.</p>
        {approved.length === 0 ? (
          <div className="card mt-4 p-8 text-center text-lg text-stone-500">No hay eventos aprobados próximamente.</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {approved.map((r) => (
              <li key={r.id} className="card flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <span className="grid w-20 shrink-0 place-items-center rounded-2xl bg-brand-50 py-2 text-center text-lg font-extrabold leading-tight text-brand-800">
                  {formatShortDate(r.date)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold text-stone-900">{r.user.name} <span className="font-normal text-stone-500">· {r.user.house}</span></span>
                  <span className="block text-base text-stone-600">{formatTime(r.startTime)} – {formatTime(r.endTime)} · {r.reason}</span>
                  {blockedMap.has(r.date) && (
                    <span className="mt-1 flex items-center gap-1.5 text-base font-semibold text-amber-800">
                      <CalendarX2 className="h-4 w-4" aria-hidden /> Este día fue bloqueado: {blockedMap.get(r.date)}
                    </span>
                  )}
                </span>
                <span className="flex flex-wrap gap-2">
                  <WhatsAppButton compact label="WhatsApp" href={whatsappLink(r.user.phone, reservationWhatsappMessage(r.user.name, r))} />
                  <StaffCancelButton id={r.id} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
