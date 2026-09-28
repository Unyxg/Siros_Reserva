import { cloudEnabled } from "@/lib/whatsapp-cloud";

/**
 * Tries the automatic WhatsApp (Cloud API). If it isn't configured or the send fails,
 * returns a wa.me link so the person can send the notice by hand.
 */
export async function deliver(send: () => Promise<boolean>, fallback: () => Promise<string | null> | string | null) {
  if (cloudEnabled() && (await send())) return { sent: true as const, whatsapp: null };
  return { sent: false as const, whatsapp: await fallback() };
}
