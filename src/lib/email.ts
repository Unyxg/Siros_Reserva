import { Resend } from "resend";
import { appUrl } from "@/lib/app-url";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Reserva la Palapa <onboarding@resend.dev>";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

type Button = { label: string; href: string; secondary?: boolean };

/** Simple, large-type HTML email that renders well in Gmail, Outlook and phones. */
export function emailLayout({ title, intro, rows, note, buttons = [] }: { title: string; intro: string; rows?: [string, string][]; note?: string; buttons?: Button[] }) {
  const rowsHtml = rows?.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0;background:#f6f7f4;border-radius:14px">${rows
        .map(([k, v]) => `<tr><td style="padding:10px 16px;color:#57534e;font-size:16px;width:38%">${esc(k)}</td><td style="padding:10px 16px;font-weight:700;font-size:17px;color:#1c1917">${esc(v)}</td></tr>`)
        .join("")}</table>`
    : "";
  const noteHtml = note ? `<p style="background:#fff7ed;border-radius:12px;padding:14px 16px;color:#7c2d12;font-size:16px">${esc(note)}</p>` : "";
  const buttonsHtml = buttons
    .map(
      (b) =>
        `<a href="${esc(b.href)}" style="display:inline-block;margin:6px 8px 6px 0;padding:14px 22px;border-radius:14px;font-size:17px;font-weight:700;text-decoration:none;${
          b.secondary ? "background:#fff;color:#065f46;border:2px solid #a7f3d0" : "background:#059669;color:#fff"
        }">${esc(b.label)}</a>`,
    )
    .join("");

  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f7f4;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <p style="font-size:20px;font-weight:800;color:#065f46;margin:0 0 16px">🌴 Reserva la Palapa</p>
    <div style="background:#fff;border-radius:20px;padding:28px 24px;border:1px solid #e7e5e4">
      <h1 style="font-size:24px;color:#1c1917;margin:0 0 12px">${esc(title)}</h1>
      <p style="font-size:17px;line-height:1.5;color:#44403c;margin:0">${esc(intro)}</p>
      ${rowsHtml}${noteHtml}
      <div style="margin-top:20px">${buttonsHtml}</div>
    </div>
    <p style="font-size:13px;color:#a8a29e;text-align:center;margin-top:20px">Recibiste este correo por tu cuenta en <a href="${appUrl()}" style="color:#a8a29e">${esc(appUrl().replace(/^https?:\/\//, ""))}</a>.</p>
  </div></body></html>`;
}

export async function sendEmail({ to, subject, html, attachments }: { to: string | string[]; subject: string; html: string; attachments?: { filename: string; content: string }[] }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  if (!resend) {
    // Development fallback: no API key configured, just log what would be sent.
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")).filter((l) => !l.includes("calendar.google"));
    console.log(`📧 [correo simulado] Para: ${recipients.join(", ")} | Asunto: ${subject}${links.length ? `\n   Enlaces: ${links.join("  ")}` : ""}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: recipients,
      subject,
      html,
      attachments: attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })),
    });
    if (error) console.error("Error enviando correo:", error);
  } catch (e) {
    // Never let an email failure break the user's action.
    console.error("Error enviando correo:", e);
  }
}
