"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { setContactWhatsapp, setInviteCode } from "@/lib/settings";
import { appUrl } from "@/lib/app-url";
import { accountApprovedMessage, passwordResetMessage, whatsappLink } from "@/lib/whatsapp";
import { notifyAccountApproved, sendPasswordReset } from "@/lib/notify";
import { sendTestMessage } from "@/lib/whatsapp-cloud";
import { getContactWhatsapp } from "@/lib/settings";
import { deliver } from "@/lib/deliver";
import { createResetToken } from "@/lib/password-reset";
import { todayISO } from "@/lib/format";
import type { ActionResult } from "@/app/actions/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

const denied: ActionResult = { ok: false, message: "Solo la administración puede hacer esto." };

export async function approveAccount(userId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return denied;
  const user = await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  const d = await deliver(
    () => notifyAccountApproved(user),
    () => whatsappLink(user.phone, accountApprovedMessage(user)),
  );
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `Cuenta de ${user.name} aprobada.${d.sent ? " Se le avisó por WhatsApp." : ""}`, whatsapp: d.whatsapp };
}

/** Rejecting a pending sign-up deletes it, so the person can register again if it was a mistake. */
export async function rejectAccount(userId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return denied;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "PENDING") return { ok: false, message: "La cuenta ya no está pendiente." };
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Solicitud de cuenta rechazada." };
}

export async function setAccountActive(userId: string, active: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return denied;
  if (admin.id === userId) return { ok: false, message: "No puedes desactivar tu propia cuenta." };
  await prisma.user.update({ where: { id: userId }, data: { status: active ? "ACTIVE" : "DISABLED" } });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: active ? "Cuenta reactivada." : "Cuenta desactivada." };
}

export async function changeRole(userId: string, role: Role): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return denied;
  if (!["USER", "APPROVER", "ADMIN"].includes(role)) return { ok: false, message: "Rol no válido." };
  if (admin.id === userId) return { ok: false, message: "No puedes cambiar tu propio rol." };
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Rol actualizado." };
}

export async function updateInviteCode(code: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return denied;
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,30}$/.test(clean)) return { ok: false, message: "Usa de 4 a 30 letras o números, sin espacios." };
  await setInviteCode(clean);
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true, message: `Nuevo código de invitación: ${clean}` };
}

export async function blockDate(date: string, reason: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return denied;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Elige una fecha." };
  if (date < todayISO()) return { ok: false, message: "La fecha ya pasó." };
  const why = reason.trim().slice(0, 120);
  if (why.length < 3) return { ok: false, message: "Escribe el motivo (lo verán los vecinos)." };

  await prisma.blockedDate.upsert({ where: { date }, update: { reason: why }, create: { date, reason: why } });
  const affected = await prisma.reservation.count({ where: { date, status: { in: ["PENDING", "APPROVED"] } } });
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    message: affected
      ? `Día bloqueado. Ojo: hay ${affected} reservación(es) ese día; cancélalas si es necesario.`
      : "Día bloqueado.",
  };
}

export async function unblockDate(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return denied;
  await prisma.blockedDate.delete({ where: { id } }).catch(() => null);
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Día desbloqueado." };
}

export async function updateContactWhatsapp(phone: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return denied;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return { ok: false, message: "Escribe el número a 10 dígitos." };
  await setContactWhatsapp(digits);
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true, message: "Número de contacto guardado." };
}

/** Creates a single-use, 24-hour link to set a new password; the admin sends it by WhatsApp. */
export async function createPasswordResetLink(userId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return denied;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, message: "No se encontró la cuenta." };

  const token = await createResetToken(userId);

  const link = appUrl(`/restablecer?token=${token}`);
  const d = await deliver(
    () => sendPasswordReset(user, token),
    () => whatsappLink(user.phone, passwordResetMessage(user, link)) ?? `https://wa.me/?text=${encodeURIComponent(passwordResetMessage(user, link))}`,
  );
  return {
    ok: true,
    message: d.sent ? `Le enviamos a ${user.name} el enlace por WhatsApp.` : `Enlace creado para ${user.name}. Envíaselo por WhatsApp.`,
    whatsapp: d.whatsapp,
  };
}

/** Sends Meta's "hello_world" sample to the administration's number to check the Cloud API setup. */
export async function testWhatsappCloud(): Promise<ActionResult> {
  if (!(await requireAdmin())) return denied;
  const res = await sendTestMessage(await getContactWhatsapp());
  return res.ok
    ? { ok: true, message: "¡Mensaje de prueba enviado! Revisa el WhatsApp de la administración." }
    : { ok: false, message: `No se pudo enviar: ${res.error}` };
}
