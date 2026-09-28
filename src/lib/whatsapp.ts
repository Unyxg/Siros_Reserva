import { formatLongDate, formatTime } from "@/lib/format";

/**
 * Builds a free "click to chat" WhatsApp link (wa.me) with a pre-written message.
 * The approver taps it and WhatsApp opens ready to send – no API or cost involved.
 */
export function whatsappLink(phone: string | null | undefined, message: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  // 10-digit Mexican numbers get the country code
  const full = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

type R = { date: string; startTime: string; endTime: string; status: string; reviewNote?: string | null; cancelReason?: string | null };

export function reservationWhatsappMessage(name: string, r: R, url: string) {
  const first = name.split(" ")[0];
  const when = `${formatLongDate(r.date)} de ${formatTime(r.startTime)} a ${formatTime(r.endTime)}`;
  if (r.status === "APPROVED")
    return `¡Hola ${first}! 🌴 Tu reservación de la Palapa para el ${when} fue *APROBADA* ✅.\n\nPuedes verla y agregarla a tu calendario aquí: ${url}`;
  if (r.status === "REJECTED")
    return `Hola ${first}. Tu solicitud de la Palapa para el ${when} fue *rechazada*.${r.reviewNote ? `\nMotivo: ${r.reviewNote}` : ""}\n\nPuedes elegir otra fecha aquí: ${url}`;
  if (r.status === "CANCELLED")
    return `Hola ${first}. Tu reservación de la Palapa para el ${when} fue *cancelada*.${r.cancelReason ? `\nMotivo: ${r.cancelReason}` : ""}\n\nPuedes elegir otra fecha aquí: ${url}`;
  return `Hola ${first}. Recibimos tu solicitud de la Palapa para el ${when}. Te avisaremos pronto.`;
}
