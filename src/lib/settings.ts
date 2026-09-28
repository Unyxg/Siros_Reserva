import { prisma } from "@/lib/prisma";

const DEFAULT_INVITE_CODE = process.env.INVITE_CODE || "PALAPA2026";

async function get(key: string) {
  return (await prisma.setting.findUnique({ where: { key } }))?.value ?? null;
}

async function set(key: string, value: string) {
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function getInviteCode() {
  return (await get("inviteCode")) ?? DEFAULT_INVITE_CODE;
}

export const setInviteCode = (value: string) => set("inviteCode", value);

/** WhatsApp number neighbors write to (new accounts, forgotten passwords). Falls back to an admin's phone. */
export async function getContactWhatsapp() {
  const saved = await get("contactWhatsapp");
  if (saved) return saved;
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE", phone: { not: null } }, select: { phone: true } });
  return admin?.phone ?? null;
}

export const setContactWhatsapp = (value: string) => set("contactWhatsapp", value);

/** Who residents notify about a new request: the first approver with a phone, otherwise the contact number. */
export async function getCommitteeWhatsapp() {
  const approver = await prisma.user.findFirst({
    where: { role: "APPROVER", status: "ACTIVE", phone: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { phone: true },
  });
  return approver?.phone ?? (await getContactWhatsapp());
}
