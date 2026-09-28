/**
 * Submits the app's WhatsApp message templates to Meta for approval, or shows their status.
 *
 *   npm run whatsapp:templates            -> create any missing templates
 *   npm run whatsapp:templates -- status  -> list templates and whether Meta approved them
 *   npm run whatsapp:templates -- --dry-run  -> print what would be sent
 *
 * Needs (in .env or the shell): WHATSAPP_TOKEN, WHATSAPP_BUSINESS_ACCOUNT_ID and
 * APP_URL (your public address, e.g. https://siros-reserva.vercel.app) for the buttons.
 */
import { TEMPLATES, type TemplateDef } from "../src/lib/whatsapp-templates";

const VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";
const LANG = process.env.WHATSAPP_TEMPLATE_LANG || "es_MX";
const TOKEN = process.env.WHATSAPP_TOKEN;
const WABA = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const APP_URL = (process.env.APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

function payload(t: TemplateDef) {
  const components: object[] = [{ type: "BODY", text: t.body, example: { body_text: [t.examples] } }];
  if (t.button) {
    const url = `${APP_URL}${t.button.path}`;
    components.push({
      type: "BUTTONS",
      buttons: [
        t.button.kind === "token"
          ? { type: "URL", text: t.button.text, url: `${url}{{1}}`, example: [`${url}ejemplo123`] }
          : { type: "URL", text: t.button.text, url },
      ],
    });
  }
  return { name: t.name, language: LANG, category: "UTILITY", components };
}

async function graph(path: string, init?: RequestInit) {
  const res = await fetch(`https://graph.facebook.com/${VERSION}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function existing() {
  const { ok, json } = await graph(`${WABA}/message_templates?fields=name,status,language,rejected_reason&limit=200`);
  if (!ok) throw new Error(json?.error?.message ?? "No se pudieron leer las plantillas");
  return json.data as { name: string; status: string; language: string; rejected_reason?: string }[];
}

async function main() {
  if (!APP_URL.startsWith("https://")) {
    console.error("Falta APP_URL con tu dirección pública (https://…). Ej: APP_URL=https://siros-reserva.vercel.app");
    process.exit(1);
  }
  const defs = Object.values(TEMPLATES) as TemplateDef[];

  if (dryRun) {
    for (const t of defs) console.log(JSON.stringify(payload(t), null, 2));
    return;
  }
  if (!TOKEN || !WABA) {
    console.error("Faltan WHATSAPP_TOKEN y/o WHATSAPP_BUSINESS_ACCOUNT_ID.");
    process.exit(1);
  }

  const current = await existing();
  const ours = new Set(defs.map((d) => d.name));

  if (args.includes("status")) {
    const icon: Record<string, string> = { APPROVED: "✅", PENDING: "⏳", REJECTED: "❌", PAUSED: "⏸️", DISABLED: "🚫" };
    for (const t of current.filter((c) => ours.has(c.name)))
      console.log(`${icon[t.status] ?? "•"} ${t.name} (${t.language}): ${t.status}${t.rejected_reason && t.rejected_reason !== "NONE" ? ` – ${t.rejected_reason}` : ""}`);
    const missing = defs.filter((d) => !current.some((c) => c.name === d.name));
    if (missing.length) console.log(`Faltan por crear: ${missing.map((m) => m.name).join(", ")}`);
    return;
  }

  for (const t of defs) {
    if (current.some((c) => c.name === t.name && c.language === LANG)) {
      console.log(`• ${t.name}: ya existe`);
      continue;
    }
    const { ok, json } = await graph(`${WABA}/message_templates`, { method: "POST", body: JSON.stringify(payload(t)) });
    console.log(ok ? `✔ ${t.name}: enviada a revisión (${json.status ?? "PENDING"})` : `✖ ${t.name}: ${json?.error?.error_user_msg ?? json?.error?.message}`);
  }
  console.log("\nMeta suele aprobarlas en minutos. Revisa con: npm run whatsapp:templates -- status");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
