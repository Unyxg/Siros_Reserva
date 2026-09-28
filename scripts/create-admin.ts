/**
 * Creates (or promotes) an admin account. Use it once after deploying.
 *
 *   npm run create-admin -- tu@correo.com "Tu Nombre" "UnaContraseñaSegura" [5512345678]
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [email, name, password, phoneArg] = process.argv.slice(2);
  const phone = phoneArg?.replace(/\D/g, "") || undefined;
  if (!email || !name || !password || password.length < 8) {
    console.error('Uso: npm run create-admin -- correo@ejemplo.com "Nombre" "contraseña (mín. 8)" [WhatsApp a 10 dígitos]');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "ADMIN", status: "ACTIVE", password: hash, name, ...(phone ? { phone } : {}) },
    create: { email: email.toLowerCase(), name, password: hash, role: "ADMIN", status: "ACTIVE", house: "Administración", phone },
  });
  console.log(`✅ Administrador listo: ${user.email}`);
}

main().finally(() => prisma.$disconnect());
