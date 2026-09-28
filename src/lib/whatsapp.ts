import { appUrl } from "@/lib/app-url";
import { formatLongDate, formatTime } from "@/lib/format";

/**
 * Free "click to chat" WhatsApp links (wa.me) with a pre-written message.
 * The person taps the link, WhatsApp opens ready to send – no API or cost involved.
 */
export function whatsappLink(phone: string | null | undefined, message: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  // 10-digit Mexican numbers get the country code
  const full = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

/** Share link without a fixed recipient (the person picks a chat or group). */
export const whatsappShareLink = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`;

type Person = { name: string; house?: string | null; email?: string };
type R = { date: string; startTime: string; endTime: string; status: string; reason?: string; guests?: number | null; reviewNote?: string | null; cancelReason?: string | null };

const first = (name: string) => name.split(" ")[0];
const when = (r: R) => `${formatLongDate(r.date)} de ${formatTime(r.startTime)} a ${formatTime(r.endTime)}`;

/** Staff → resident: result of their request. */
export function reservationWhatsappMessage(name: string, r: R) {
  const url = appUrl("/dashboard");
  if (r.status === "APPROVED")
    return `¡Hola ${first(name)}! 🌴 Tu reservación de la Palapa para el ${when(r)} fue *APROBADA* ✅.\n\nPuedes verla y agregarla a tu calendario aquí: ${url}`;
  if (r.status === "REJECTED")
    return `Hola ${first(name)}. Tu solicitud de la Palapa para el ${when(r)} fue *rechazada*.${r.reviewNote ? `\nMotivo: ${r.reviewNote}` : ""}\n\nPuedes elegir otra fecha aquí: ${url}`;
  if (r.status === "CANCELLED")
    return `Hola ${first(name)}. Tu reservación de la Palapa para el ${when(r)} fue *cancelada*.${r.cancelReason ? `\nMotivo: ${r.cancelReason}` : ""}\n\nPuedes elegir otra fecha aquí: ${url}`;
  return `Hola ${first(name)}. Recibimos tu solicitud de la Palapa para el ${when(r)}. Te avisaremos pronto.`;
}

/** Resident → committee: new request. */
export function newRequestMessage(user: Person, r: R) {
  return `Hola 👋, soy ${user.name}${user.house ? ` (${user.house})` : ""}. Acabo de solicitar la Palapa para el ${when(r)}${r.guests ? `, ${r.guests} personas` : ""}.\nMotivo: ${r.reason}\n\nPuedes aprobarla aquí: ${appUrl("/dashboard/aprobador")}`;
}

/** Resident → committee: they cancelled, the slot is free. */
export function residentCancelledMessage(user: Person, r: R) {
  return `Hola, soy ${user.name}${user.house ? ` (${user.house})` : ""}. Cancelé mi reservación de la Palapa del ${when(r)}; el horario quedó libre.`;
}

/** New neighbor → admin: please approve my account. */
export function newAccountMessage(user: Person) {
  return `Hola 👋, soy ${user.name}${user.house ? ` de ${user.house}` : ""}. Me acabo de registrar en la app de la Palapa con el correo ${user.email}. ¿Me ayudas a aprobar mi cuenta? ${appUrl("/dashboard/admin/usuarios")}`;
}

/** Admin → neighbor: account approved. */
export function accountApprovedMessage(user: Person) {
  return `¡Hola ${first(user.name)}! 🌴 Tu cuenta de la app de la Palapa ya fue *aprobada*.\nEntra aquí con tu correo (${user.email}) y tu contraseña: ${appUrl("/login")}`;
}

/** Admin → neighbor: link to set a new password. */
export function passwordResetMessage(user: Person, link: string) {
  return `Hola ${first(user.name)}. Aquí está tu enlace para crear una nueva contraseña de la app de la Palapa (funciona una sola vez, durante 24 horas):\n${link}`;
}

/** Neighbor → admin: I forgot my password. */
export function forgotPasswordMessage(email: string) {
  return `Hola 👋, olvidé mi contraseña de la app de la Palapa.${email ? ` Mi correo es ${email}.` : ""} ¿Me mandas un enlace para crear una nueva?`;
}
