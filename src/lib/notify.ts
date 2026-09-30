import type { Reservation, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getContactWhatsapp } from "@/lib/settings";
import { sendTemplate, toWhatsappNumber } from "@/lib/whatsapp-cloud";
import { formatLongDate, formatTime } from "@/lib/format";

/** Automatic WhatsApp notices (Cloud API). Each returns true if at least one message went out. */
type Person = { name: string; house?: string | null; phone?: string | null; email?: string };

const first = (name: string) => name.split(" ")[0];
const date = (r: Reservation) => formatLongDate(r.date);
const hours = (r: Reservation) => `${formatTime(r.startTime)} a ${formatTime(r.endTime)}`;

async function staffPhones(roles: Role[], extra: (string | null)[] = []) {
  const staff = await prisma.user.findMany({ where: { role: { in: roles }, status: "ACTIVE", phone: { not: null } }, select: { phone: true } });
  // De-duplicate so nobody gets the same notice twice
  const numbers = new Map<string, string>();
  for (const p of [...staff.map((s) => s.phone), ...extra]) {
    const n = toWhatsappNumber(p);
    if (n && p) numbers.set(n, p);
  }
  return [...numbers.values()];
}

async function sendToAll(phones: string[], send: (p: string) => Promise<boolean>) {
  const results = await Promise.all(phones.map(send));
  return results.some(Boolean);
}

// Committee notices also go to the administration's contact number (the admin account may have no phone saved)
const committeePhones = async () => staffPhones(["APPROVER", "ADMIN"], [await getContactWhatsapp()]);

export async function notifyNewRequest(r: Reservation, user: Person) {
  const phones = await committeePhones();
  return sendToAll(phones, (p) => sendTemplate(p, "newRequest", [user.name, user.house ?? "—", date(r), hours(r), r.reason]));
}

export async function notifySlotFreed(r: Reservation, user: Person) {
  const phones = await committeePhones();
  return sendToAll(phones, (p) => sendTemplate(p, "slotFreed", [user.name, user.house ?? "—", date(r), hours(r)]));
}

export function notifyReviewed(r: Reservation, owner: Person) {
  return r.status === "APPROVED"
    ? sendTemplate(owner.phone, "approved", [first(owner.name), date(r), hours(r)])
    : sendTemplate(owner.phone, "rejected", [first(owner.name), date(r), hours(r), r.reviewNote ?? "—"]);
}

export function notifyCancelledByStaff(r: Reservation, owner: Person) {
  return sendTemplate(owner.phone, "cancelledByStaff", [first(owner.name), date(r), hours(r), r.cancelReason ?? "—"]);
}

export async function notifyNewAccount(user: Person) {
  const phones = await staffPhones(["ADMIN"], [await getContactWhatsapp()]);
  return sendToAll(phones, (p) => sendTemplate(p, "newAccount", [user.name, user.house ?? "—", user.phone ?? "—"]));
}

export function notifyAccountApproved(user: Person) {
  return sendTemplate(user.phone, "accountApproved", [user.name]);
}

export function sendPasswordReset(user: Person, token: string) {
  return sendTemplate(user.phone, "passwordReset", [first(user.name)], token);
}
