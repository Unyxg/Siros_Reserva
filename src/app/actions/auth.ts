"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const registerSchema = z.object({
  name: z.string().trim().min(3, "Escribe tu nombre completo."),
  email: z.string().trim().toLowerCase().email("El correo no es válido."),
  house: z.string().trim().min(1, "Indica tu número de casa o departamento."),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function registerUser(input: z.input<typeof registerSchema>): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { name, email, house, phone, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, message: "Ya existe una cuenta con ese correo." };

  await prisma.user.create({
    data: { name, email, house, phone: phone || null, password: await bcrypt.hash(password, 10) },
  });

  return { ok: true, message: "¡Cuenta creada! Ya puedes entrar." };
}
