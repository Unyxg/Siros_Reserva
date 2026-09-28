"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { addDaysISO, timesOverlap, todayISO } from "@/lib/format";
import { MAX_DAYS_AHEAD, MAX_GUESTS, TIME_OPTIONS } from "@/lib/constants";
import { getCommitteeWhatsapp } from "@/lib/settings";
import { newRequestMessage, reservationWhatsappMessage, residentCancelledMessage, whatsappLink } from "@/lib/whatsapp";
import { notifyCancelledByStaff, notifyNewRequest, notifyReviewed, notifySlotFreed } from "@/lib/notify";
import { deliver } from "@/lib/deliver";
import type { ActionResult } from "@/app/actions/auth";

function revalidateDashboards() {
  revalidatePath("/dashboard", "layout");
}

async function findApprovedConflict(date: string, startTime: string, endTime: string, excludeId?: string) {
  const approved = await prisma.reservation.findMany({
    where: { date, status: "APPROVED", ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  return approved.find((r) => timesOverlap(startTime, endTime, r.startTime, r.endTime));
}

const createSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha."),
    startTime: z.string().refine((t) => TIME_OPTIONS.includes(t), "Elige una hora de inicio."),
    endTime: z.string().refine((t) => TIME_OPTIONS.includes(t), "Elige una hora de fin."),
    guests: z.coerce.number().int().min(1, "Indica cuántas personas asistirán.").max(MAX_GUESTS, `El máximo es ${MAX_GUESTS} personas.`),
    reason: z.string().trim().min(3, "Cuéntanos brevemente el motivo del evento.").max(300, "El motivo es demasiado largo."),
  })
  .refine((d) => d.endTime > d.startTime, { message: "La hora de fin debe ser después de la hora de inicio." });

export async function createReservation(input: z.input<typeof createSchema>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { date, startTime, endTime, guests, reason } = parsed.data;

  const today = todayISO();
  if (date < today) return { ok: false, message: "No puedes reservar una fecha que ya pasó." };
  if (date > addDaysISO(today, MAX_DAYS_AHEAD))
    return { ok: false, message: `Solo puedes reservar con hasta ${MAX_DAYS_AHEAD} días de anticipación.` };

  const blocked = await prisma.blockedDate.findUnique({ where: { date } });
  if (blocked) return { ok: false, message: `La Palapa está cerrada ese día: ${blocked.reason}.` };

  if (await findApprovedConflict(date, startTime, endTime))
    return { ok: false, message: "Ese horario ya está reservado. Por favor elige otro." };

  const mine = await prisma.reservation.findMany({ where: { userId: user.id, date, status: "PENDING" } });
  if (mine.some((r) => timesOverlap(startTime, endTime, r.startTime, r.endTime)))
    return { ok: false, message: "Ya tienes una solicitud pendiente en ese horario." };

  const reservation = await prisma.reservation.create({ data: { userId: user.id, date, startTime, endTime, guests, reason } });

  const d = await deliver(
    () => notifyNewRequest(reservation, user),
    async () => whatsappLink(await getCommitteeWhatsapp(), newRequestMessage(user, reservation)),
  );
  revalidateDashboards();
  return {
    ok: true,
    message: d.sent ? "¡Solicitud enviada! Ya avisamos al comité por WhatsApp." : "¡Solicitud enviada! Verás la respuesta aquí mismo.",
    whatsapp: d.whatsapp,
  };
}

/** Residents cancel their own bookings; approvers/admins can cancel any (with a reason) to free the slot. */
export async function cancelReservation(id: string, reason?: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const reservation = await prisma.reservation.findUnique({ where: { id }, include: { user: true } });
  const isOwner = reservation?.userId === user.id;
  if (!reservation || (!isOwner && !isStaff(user.role))) return { ok: false, message: "No se encontró la solicitud." };
  if (reservation.status === "REJECTED" || reservation.status === "CANCELLED")
    return { ok: false, message: "Esta solicitud ya no se puede cancelar." };
  if (reservation.date < todayISO()) return { ok: false, message: "No puedes cancelar un evento que ya pasó." };

  const byStaff = !isOwner;
  const trimmed = reason?.trim().slice(0, 300) || null;
  if (byStaff && !trimmed) return { ok: false, message: "Escribe el motivo de la cancelación para avisarle al vecino." };

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "CANCELLED", cancelReason: trimmed, cancelledAt: new Date() },
  });

  // Staff tell the neighbor; a neighbor who frees an approved slot tells the committee
  const d = byStaff
    ? await deliver(
        () => notifyCancelledByStaff(updated, reservation.user),
        () => whatsappLink(reservation.user.phone, reservationWhatsappMessage(reservation.user.name, updated)),
      )
    : reservation.status === "APPROVED"
      ? await deliver(
          () => notifySlotFreed(updated, reservation.user),
          async () => whatsappLink(await getCommitteeWhatsapp(), residentCancelledMessage(reservation.user, updated)),
        )
      : { sent: false, whatsapp: null };

  revalidateDashboards();
  return {
    ok: true,
    message: `Reservación cancelada. El horario quedó libre.${d.sent ? (byStaff ? " Se le avisó al vecino por WhatsApp." : " Avisamos al comité por WhatsApp.") : ""}`,
    whatsapp: d.whatsapp,
  };
}

export async function reviewReservation(id: string, decision: "APPROVED" | "REJECTED", note?: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return { ok: false, message: "No tienes permiso para esta acción." };

  const reservation = await prisma.reservation.findUnique({ where: { id }, include: { user: true } });
  if (!reservation) return { ok: false, message: "No se encontró la solicitud." };
  if (reservation.status !== "PENDING") return { ok: false, message: "Esta solicitud ya fue revisada." };

  if (decision === "APPROVED") {
    if (await prisma.blockedDate.findUnique({ where: { date: reservation.date } }))
      return { ok: false, message: "No se puede aprobar: ese día está bloqueado." };
    if (await findApprovedConflict(reservation.date, reservation.startTime, reservation.endTime, id))
      return { ok: false, message: "No se puede aprobar: ya hay otra reservación aprobada en ese horario." };
  }

  const trimmed = note?.trim().slice(0, 300) || null;
  if (decision === "REJECTED" && !trimmed)
    return { ok: false, message: "Escribe el motivo del rechazo para que el residente sepa por qué." };

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: decision, reviewNote: trimmed, reviewedById: user.id, reviewedAt: new Date() },
  });

  const d = await deliver(
    () => notifyReviewed(updated, reservation.user),
    () => whatsappLink(reservation.user.phone, reservationWhatsappMessage(reservation.user.name, updated)),
  );
  revalidateDashboards();
  return {
    ok: true,
    message: `${decision === "APPROVED" ? "Solicitud aprobada" : "Solicitud rechazada"}${d.sent ? ". Se le avisó al vecino por WhatsApp." : ""}`,
    whatsapp: d.whatsapp,
  };
}
