import { prisma } from "@/lib/prisma";

const DEFAULT_INVITE_CODE = process.env.INVITE_CODE || "PALAPA2026";

export async function getInviteCode() {
  const row = await prisma.setting.findUnique({ where: { key: "inviteCode" } });
  return row?.value ?? DEFAULT_INVITE_CODE;
}

export async function setInviteCode(value: string) {
  await prisma.setting.upsert({ where: { key: "inviteCode" }, update: { value }, create: { key: "inviteCode", value } });
}
