"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { addDaysISO, timesOverlap, todayISO } from "@/lib/format";
import { MAX_DAYS_AHEAD, MAX_GUESTS, TIME_OPTIONS } from "@/lib/constants";
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

  if (await findApprovedConflict(date, startTime, endTime))
    return { ok: false, message: "Ese horario ya está reservado. Por favor elige otro." };

  const mine = await prisma.reservation.findMany({ where: { userId: user.id, date, status: "PENDING" } });
  if (mine.some((r) => timesOverlap(startTime, endTime, r.startTime, r.endTime)))
    return { ok: false, message: "Ya tienes una solicitud pendiente en ese horario." };

  await prisma.reservation.create({ data: { userId: user.id, date, startTime, endTime, guests, reason } });

  revalidateDashboards();
  return { ok: true, message: "¡Solicitud enviada! Te avisaremos cuando sea revisada." };
}

export async function cancelReservation(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation || reservation.userId !== user.id) return { ok: false, message: "No se encontró la solicitud." };
  if (reservation.status === "REJECTED" || reservation.status === "CANCELLED")
    return { ok: false, message: "Esta solicitud ya no se puede cancelar." };
  if (reservation.date < todayISO()) return { ok: false, message: "No puedes cancelar un evento que ya pasó." };

  await prisma.reservation.update({ where: { id }, data: { status: "CANCELLED" } });

  revalidateDashboards();
  return { ok: true, message: "Solicitud cancelada." };
}

export async function reviewReservation(id: string, decision: "APPROVED" | "REJECTED", note?: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "APPROVER") return { ok: false, message: "No tienes permiso para esta acción." };

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return { ok: false, message: "No se encontró la solicitud." };
  if (reservation.status !== "PENDING") return { ok: false, message: "Esta solicitud ya fue revisada." };

  if (decision === "APPROVED" && (await findApprovedConflict(reservation.date, reservation.startTime, reservation.endTime, id)))
    return { ok: false, message: "No se puede aprobar: ya hay otra reservación aprobada en ese horario." };

  const trimmed = note?.trim().slice(0, 300) || null;
  if (decision === "REJECTED" && !trimmed)
    return { ok: false, message: "Escribe el motivo del rechazo para que el residente sepa por qué." };

  await prisma.reservation.update({
    where: { id },
    data: { status: decision, reviewNote: trimmed, reviewedById: user.id, reviewedAt: new Date() },
  });

  revalidateDashboards();
  return {
    ok: true,
    message: decision === "APPROVED" ? "Solicitud aprobada ✅" : "Solicitud rechazada",
  };
}
