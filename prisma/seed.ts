import { Role, ReservationStatus, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// Demo accounts – change these passwords before going to production!
const users = [
  { name: "Ana Residente", email: "residente@palapa.com", house: "Casa 12", phone: "5512345678", role: Role.USER, status: UserStatus.ACTIVE },
  { name: "Carlos Aprobador", email: "aprobador@palapa.com", house: "Casa 3", phone: "5587654321", role: Role.APPROVER, status: UserStatus.ACTIVE },
  { name: "María Administradora", email: "admin@palapa.com", house: "Oficina", phone: "5511112222", role: Role.ADMIN, status: UserStatus.ACTIVE },
  { name: "Luis Nuevo", email: "nuevo@palapa.com", house: "Casa 27", phone: "5533334444", role: Role.USER, status: UserStatus.PENDING },
];

function isoDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const password = await bcrypt.hash("Palapa123", 10);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, house: u.house, phone: u.phone, role: u.role, status: u.status, password },
      create: { ...u, password },
    });
  }

  const resident = await prisma.user.findUniqueOrThrow({ where: { email: "residente@palapa.com" } });
  const approver = await prisma.user.findUniqueOrThrow({ where: { email: "aprobador@palapa.com" } });

  // A few sample reservations so the dashboards are not empty
  await prisma.reservation.deleteMany({ where: { userId: resident.id } });
  await prisma.reservation.createMany({
    data: [
      { userId: resident.id, date: isoDate(3), startTime: "14:00", endTime: "18:00", guests: 20, reason: "Cumpleaños de mi hija", status: ReservationStatus.PENDING },
      { userId: resident.id, date: isoDate(10), startTime: "10:00", endTime: "13:00", guests: 8, reason: "Reunión familiar", status: ReservationStatus.APPROVED, reviewedById: approver.id, reviewedAt: new Date() },
      { userId: resident.id, date: isoDate(-5), startTime: "19:00", endTime: "23:00", guests: 40, reason: "Fiesta de fin de año", status: ReservationStatus.REJECTED, reviewNote: "El horario excede el reglamento (máx. 22:00).", reviewedById: approver.id, reviewedAt: new Date() },
    ],
  });

  await prisma.setting.upsert({ where: { key: "inviteCode" }, update: {}, create: { key: "inviteCode", value: "PALAPA2026" } });
  await prisma.blockedDate.upsert({
    where: { date: isoDate(14) },
    update: {},
    create: { date: isoDate(14), reason: "Mantenimiento y fumigación" },
  });

  console.log("🔑 Código de invitación: PALAPA2026");
  console.log("✅ Base de datos lista. Usuarios de prueba (contraseña: Palapa123):");
  users.forEach((u) => console.log(`   • ${u.role.padEnd(8)} ${u.email}${u.status === "PENDING" ? "  (cuenta por aprobar)" : ""}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
