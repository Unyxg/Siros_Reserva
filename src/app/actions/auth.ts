"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getContactWhatsapp, getInviteCode } from "@/lib/settings";
import { newAccountMessage, whatsappLink } from "@/lib/whatsapp";
import { notifyNewAccount, sendPasswordReset } from "@/lib/notify";
import { cloudEnabled } from "@/lib/whatsapp-cloud";
import { createResetToken, resetRecentlyRequested } from "@/lib/password-reset";
import { deliver } from "@/lib/deliver";
import { hashToken } from "@/lib/tokens";
import { passwordProblem } from "@/lib/password-rules";

/** `whatsapp` is an optional wa.me link the UI offers right after the action. */
export type ActionResult = { ok: true; message: string; whatsapp?: string | null } | { ok: false; message: string };

const phoneSchema = z
  .string()
  .trim()
  .transform((p) => p.replace(/\D/g, ""))
  .refine((p) => p.length >= 10 && p.length <= 13, "Escribe tu teléfono a 10 dígitos (para avisos por WhatsApp).");

const registerSchema = z.object({
  name: z.string().trim().min(3, "Escribe tu nombre completo."),
  email: z.string().trim().toLowerCase().email("El correo no es válido."),
  house: z.string().trim().min(1, "Indica tu número de casa o departamento."),
  phone: phoneSchema,
  password: z.string().superRefine((p, ctx) => {
    const problem = passwordProblem(p);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  }),
  inviteCode: z.string().trim().min(1, "Escribe el código de invitación."),
});

export async function registerUser(input: z.input<typeof registerSchema>): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { name, email, house, phone, password, inviteCode } = parsed.data;

  if (inviteCode.toUpperCase() !== (await getInviteCode()).toUpperCase())
    return { ok: false, message: "El código de invitación no es correcto. Pídelo a la administración." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, message: "Ya existe una cuenta con ese correo." };

  const user = await prisma.user.create({
    data: { name, email, house, phone, password: await bcrypt.hash(password, 10), status: "PENDING" },
  });

  const d = await deliver(
    () => notifyNewAccount(user),
    async () => whatsappLink(await getContactWhatsapp(), newAccountMessage(user)),
  );
  return {
    ok: true,
    message: d.sent
      ? "¡Listo! Ya avisamos a la administración por WhatsApp; te escribirán cuando tu cuenta esté aprobada."
      : "¡Listo! Tu cuenta quedó registrada y la administración la revisará.",
    whatsapp: d.whatsapp,
  };
}

/** Self-service reset (only with the Cloud API): sends the link to the account's WhatsApp. */
export async function requestPasswordReset(emailInput: string): Promise<ActionResult> {
  if (!cloudEnabled()) return { ok: false, message: "Pide el enlace a la administración por WhatsApp." };
  const email = emailInput.trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { ok: false, message: "El correo no es válido." };

  // Same answer whether or not the account exists, so accounts can't be discovered.
  const generic: ActionResult = { ok: true, message: "Si el correo está registrado, te enviamos el enlace por WhatsApp al número de tu cuenta." };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status === "DISABLED" || !user.phone) return generic;
  if (await resetRecentlyRequested(user.id)) return generic;

  await sendPasswordReset(user, await createResetToken(user.id));
  return generic;
}

export async function resetPassword(token: string, password: string): Promise<ActionResult> {
  const problem = passwordProblem(password);
  if (problem) return { ok: false, message: problem };

  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date())
    return { ok: false, message: "El enlace ya no es válido o expiró. Pide uno nuevo a la administración." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { password: await bcrypt.hash(password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true, message: "¡Contraseña actualizada! Ya puedes entrar." };
}
