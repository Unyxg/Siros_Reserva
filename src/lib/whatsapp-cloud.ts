import { TEMPLATES, type TemplateDef, type TemplateKey } from "@/lib/whatsapp-templates";

/**
 * Meta WhatsApp Cloud API client (automatic messages).
 * Enabled only when WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set; otherwise the
 * app falls back to the free wa.me buttons.
 */
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";
const LANG = process.env.WHATSAPP_TEMPLATE_LANG || "es_MX";
// Overridable only for local testing against a mock server
const BASE = process.env.WHATSAPP_API_BASE || "https://graph.facebook.com";

export const cloudEnabled = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/** "55 1234 5678" -> "525512345678" (10-digit Mexican numbers get the country code). */
export function toWhatsappNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 ? `52${digits}` : digits;
}

// Meta rejects parameters with line breaks, tabs or 4+ spaces in a row.
const clean = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 900) || "—";

export async function sendTemplate(phone: string | null | undefined, key: TemplateKey, params: string[], buttonParam?: string): Promise<boolean> {
  const to = toWhatsappNumber(phone);
  if (!cloudEnabled() || !to) return false;

  const tpl: TemplateDef = TEMPLATES[key];
  const components: object[] = [{ type: "body", parameters: params.map((p) => ({ type: "text", text: clean(p) })) }];
  if (tpl.button?.kind === "token" && buttonParam)
    components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: buttonParam }] });

  try {
    const res = await fetch(`${BASE}/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: tpl.name, language: { code: LANG }, components } }),
    });
    if (!res.ok) {
      console.error(`WhatsApp: no se pudo enviar ${tpl.name} a ${to}:`, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error(`WhatsApp: error enviando ${tpl.name}:`, e);
    return false;
  }
}

async function post(to: string, template: object) {
  const res = await fetch(`${BASE}/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template }),
  }).catch((e: Error) => ({ ok: false, text: async () => JSON.stringify({ error: { message: e.message } }) }) as const);
  if (res.ok) return { ok: true as const };
  const text = await res.text();
  let error = text;
  try {
    const j = JSON.parse(text).error;
    error = j?.error_data?.details ? `${j.message}: ${j.error_data.details}` : (j?.message ?? text);
  } catch {}
  return { ok: false as const, error: error.slice(0, 300) };
}

/**
 * Checks the setup. Uses our own "palapa_prueba" template (real numbers can't send Meta's
 * hello_world); on Meta's public test numbers, hello_world is the fallback.
 */
export async function sendTestMessage(phone: string | null | undefined): Promise<{ ok: boolean; error?: string }> {
  const to = toWhatsappNumber(phone);
  if (!cloudEnabled()) return { ok: false, error: "Faltan WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID en Vercel." };
  if (!to) return { ok: false, error: "Primero guarda el número de WhatsApp de la administración." };

  const own = await post(to, {
    name: TEMPLATES.test.name,
    language: { code: LANG },
    components: [{ type: "body", parameters: [{ type: "text", text: "la administración" }] }],
  });
  if (own.ok) return own;
  const fallback = await post(to, { name: "hello_world", language: { code: "en_US" } });
  if (fallback.ok) return fallback;
  // Report the error about our own template: that's the one that matters on a real number
  return { ok: false, error: /does not exist|not found|132001/i.test(own.error) ? "La plantilla de prueba aún no está aprobada por Meta. Intenta más tarde." : own.error };
}

/** The number the app actually sends from (as Meta reports it for WHATSAPP_PHONE_NUMBER_ID). */
export async function getSenderInfo(): Promise<{ id: string; number?: string; name?: string; error?: string } | null> {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!cloudEnabled() || !id) return null;
  try {
    const res = await fetch(`${BASE}/${API_VERSION}/${id}?fields=display_phone_number,verified_name`, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      next: { revalidate: 300 },
    });
    const j = await res.json();
    if (!res.ok) return { id, error: j?.error?.message ?? "No se pudo consultar el número" };
    return { id, number: j.display_phone_number, name: j.verified_name };
  } catch {
    return { id, error: "No se pudo consultar el número" };
  }
}
