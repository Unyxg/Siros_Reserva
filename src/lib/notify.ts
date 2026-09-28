import type { Reservation, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
import { emailLayout, sendEmail } from "@/lib/email";
import { buildIcs, googleCalendarUrl } from "@/lib/calendar";
import { formatLongDate, formatTime } from "@/lib/format";

type Person = Pick<User, "name" | "email" | "house">;

async function staffEmails(roles: ("APPROVER" | "ADMIN")[] = ["APPROVER", "ADMIN"]) {
  const staff = await prisma.user.findMany({ where: { role: { in: roles }, status: "ACTIVE" }, select: { email: true } });
  return staff.map((s) => s.email);
}

const when = (r: Reservation) => `${formatLongDate(r.date)}, ${formatTime(r.startTime)} – ${formatTime(r.endTime)}`;
const detailRows = (r: Reservation, u?: Person): [string, string][] => [
  ...(u ? ([["Vecino", `${u.name}${u.house ? ` (${u.house})` : ""}`]] as [string, string][]) : []),
  ["Fecha", formatLongDate(r.date)],
  ["Horario", `${formatTime(r.startTime)} – ${formatTime(r.endTime)}`],
  ...(r.guests ? ([["Personas", String(r.guests)]] as [string, string][]) : []),
  ["Motivo", r.reason],
];

export async function notifyNewAccount(user: Person) {
  await sendEmail({
    to: await staffEmails(["ADMIN"]),
    subject: `Nueva cuenta por aprobar: ${user.name}`,
    html: emailLayout({
      title: "Un vecino quiere unirse",
      intro: "Se registró una nueva cuenta y necesita tu aprobación antes de poder reservar.",
      rows: [["Nombre", user.name], ["Casa", user.house ?? "—"], ["Correo", user.email]],
      buttons: [{ label: "Revisar cuentas", href: appUrl("/dashboard/admin/usuarios") }],
    }),
  });
}

export async function notifyAccountApproved(user: Person) {
  await sendEmail({
    to: user.email,
    subject: "¡Tu cuenta fue aprobada! 🌴",
    html: emailLayout({
      title: `¡Bienvenido, ${user.name.split(" ")[0]}!`,
      intro: "Tu cuenta ya está activa. Ya puedes entrar y apartar la Palapa para tus eventos.",
      buttons: [{ label: "Entrar ahora", href: appUrl("/login") }],
    }),
  });
}

export async function notifyNewReservation(r: Reservation, user: Person) {
  await sendEmail({
    to: await staffEmails(),
    subject: `Nueva solicitud de la Palapa – ${formatLongDate(r.date)}`,
    html: emailLayout({
      title: "Nueva solicitud por revisar",
      intro: `${user.name} solicitó la Palapa.`,
      rows: detailRows(r, user),
      buttons: [{ label: "Aprobar o rechazar", href: appUrl("/dashboard/aprobador") }],
    }),
  });
}

export async function notifyReservationReviewed(r: Reservation, user: Person) {
  const approved = r.status === "APPROVED";
  await sendEmail({
    to: user.email,
    subject: approved ? `✅ Reservación aprobada – ${formatLongDate(r.date)}` : `Tu solicitud de la Palapa fue rechazada`,
    html: emailLayout({
      title: approved ? "¡Tu reservación fue aprobada!" : "Tu solicitud no fue aprobada",
      intro: approved ? `La Palapa es tuya el ${when(r)}. ¡Que disfrutes tu evento!` : "Lo sentimos, esta vez no fue posible aprobar tu solicitud.",
      rows: detailRows(r),
      note: r.reviewNote ? `Comentario del comité: ${r.reviewNote}` : undefined,
      buttons: approved
        ? [
            { label: "📅 Agregar a Google Calendar", href: googleCalendarUrl(r) },
            { label: "Ver mis reservaciones", href: appUrl("/dashboard"), secondary: true },
          ]
        : [{ label: "Elegir otra fecha", href: appUrl("/dashboard") }],
    }),
    // .ics attachment works with Apple Calendar and Outlook
    attachments: approved ? [{ filename: "palapa.ics", content: buildIcs(r) }] : undefined,
  });
}

export async function notifyReservationCancelled(r: Reservation, owner: Person, cancelledByStaff: boolean) {
  if (cancelledByStaff) {
    await sendEmail({
      to: owner.email,
      subject: `Tu reservación de la Palapa fue cancelada`,
      html: emailLayout({
        title: "Tu reservación fue cancelada",
        intro: "La administración canceló tu reservación y el horario quedó libre.",
        rows: detailRows(r),
        note: r.cancelReason ? `Motivo: ${r.cancelReason}` : undefined,
        buttons: [{ label: "Elegir otra fecha", href: appUrl("/dashboard") }],
      }),
    });
  } else {
    await sendEmail({
      to: await staffEmails(),
      subject: `${owner.name} canceló su reservación – ${formatLongDate(r.date)}`,
      html: emailLayout({
        title: "Se liberó un horario",
        intro: `${owner.name} canceló su reservación. El horario ya está disponible para otros vecinos.`,
        rows: detailRows(r, owner),
        buttons: [{ label: "Ver panel", href: appUrl("/dashboard/aprobador") }],
      }),
    });
  }
}

export async function sendPasswordResetEmail(user: Person, link: string) {
  await sendEmail({
    to: user.email,
    subject: "Restablece tu contraseña",
    html: emailLayout({
      title: "¿Olvidaste tu contraseña?",
      intro: "No pasa nada. Toca el botón para crear una nueva. El enlace funciona durante 1 hora.",
      note: "Si tú no pediste este cambio, ignora este correo; tu contraseña seguirá igual.",
      buttons: [{ label: "Crear nueva contraseña", href: link }],
    }),
  });
}
