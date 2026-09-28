import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { STATUS_LABEL, ROLE_LABEL, TIMEZONE } from "@/lib/constants";
import { todayISO } from "@/lib/format";

const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short", timeZone: TIMEZONE }).format(d) : "";

/** Admin-only Excel export of all reservations, residents and closed days. */
export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") return new Response("No autorizado", { status: 403 });

  const [reservations, users, blocked] = await Promise.all([
    prisma.reservation.findMany({
      include: { user: { select: { name: true, house: true, phone: true, email: true } }, reviewedBy: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { reservations: true } } } }),
    prisma.blockedDate.findMany({ orderBy: { date: "asc" } }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Reserva la Palapa";
  wb.created = new Date();

  const style = (ws: ExcelJS.Worksheet) => {
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    header.height = 22;
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
  };

  const rs = wb.addWorksheet("Reservaciones");
  rs.columns = [
    { header: "Fecha", key: "date", width: 12 },
    { header: "Inicio", key: "start", width: 8 },
    { header: "Fin", key: "end", width: 8 },
    { header: "Vecino", key: "name", width: 26 },
    { header: "Casa", key: "house", width: 14 },
    { header: "Teléfono", key: "phone", width: 14 },
    { header: "Correo", key: "email", width: 28 },
    { header: "Personas", key: "guests", width: 10 },
    { header: "Motivo", key: "reason", width: 36 },
    { header: "Estado", key: "status", width: 12 },
    { header: "Revisó", key: "reviewer", width: 22 },
    { header: "Fecha de revisión", key: "reviewedAt", width: 18 },
    { header: "Comentario", key: "note", width: 36 },
    { header: "Solicitada", key: "createdAt", width: 18 },
  ];
  const statusColor: Record<string, string> = { PENDING: "FFFEF3C7", APPROVED: "FFD1FAE5", REJECTED: "FFFFE4E6", CANCELLED: "FFF5F5F4" };
  for (const r of reservations) {
    const row = rs.addRow({
      date: r.date,
      start: r.startTime,
      end: r.endTime,
      name: r.user.name,
      house: r.user.house,
      phone: r.user.phone,
      email: r.user.email,
      guests: r.guests,
      reason: r.reason,
      status: STATUS_LABEL[r.status],
      reviewer: r.reviewedBy?.name ?? "",
      reviewedAt: fmt(r.reviewedAt),
      note: r.reviewNote ?? r.cancelReason ?? "",
      createdAt: fmt(r.createdAt),
    });
    row.getCell("status").fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusColor[r.status] } };
  }
  style(rs);

  const us = wb.addWorksheet("Vecinos");
  us.columns = [
    { header: "Nombre", key: "name", width: 26 },
    { header: "Casa", key: "house", width: 14 },
    { header: "Correo", key: "email", width: 28 },
    { header: "Teléfono", key: "phone", width: 14 },
    { header: "Rol", key: "role", width: 14 },
    { header: "Cuenta", key: "status", width: 12 },
    { header: "Reservaciones", key: "count", width: 14 },
    { header: "Registro", key: "createdAt", width: 18 },
  ];
  const accountLabel = { PENDING: "Por aprobar", ACTIVE: "Activa", DISABLED: "Desactivada" } as const;
  for (const u of users)
    us.addRow({ name: u.name, house: u.house, email: u.email, phone: u.phone, role: ROLE_LABEL[u.role], status: accountLabel[u.status], count: u._count.reservations, createdAt: fmt(u.createdAt) });
  style(us);

  const bs = wb.addWorksheet("Días cerrados");
  bs.columns = [
    { header: "Fecha", key: "date", width: 12 },
    { header: "Motivo", key: "reason", width: 40 },
  ];
  for (const b of blocked) bs.addRow({ date: b.date, reason: b.reason });
  style(bs);

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="palapa-reservaciones-${todayISO()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
