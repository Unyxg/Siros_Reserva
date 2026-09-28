"use server";

import { createHash, randomBytes } from "node:crypto";
import { after } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getInviteCode } from "@/lib/settings";
import { appUrl } from "@/lib/app-url";
import { notifyNewAccount, sendPasswordResetEmail } from "@/lib/notify";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

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
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
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

  after(() => notifyNewAccount(user));
  return { ok: true, message: "¡Listo! Tu cuenta quedó registrada y la administración la revisará." };
}

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const RESET_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordReset(emailInput: string): Promise<ActionResult> {
  const email = emailInput.trim().toLowerCase();
  // Same answer whether or not the account exists, so emails can't be discovered.
  const generic: ActionResult = { ok: true, message: "Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña." };
  if (!z.string().email().safeParse(email).success) return { ok: false, message: "El correo no es válido." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status === "DISABLED") return generic;

  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });

  after(() => sendPasswordResetEmail(user, appUrl(`/restablecer?token=${token}`)));
  return generic;
}

export async function resetPassword(token: string, password: string): Promise<ActionResult> {
  if (password.length < 8) return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };

  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date())
    return { ok: false, message: "El enlace ya no es válido o expiró. Pide uno nuevo." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { password: await bcrypt.hash(password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true, message: "¡Contraseña actualizada! Ya puedes entrar." };
}
