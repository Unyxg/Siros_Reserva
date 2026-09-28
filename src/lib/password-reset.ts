import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

const RESET_TTL_MS = 24 * 60 * 60 * 1000;

/** Creates a single-use, 24-hour reset token (only its hash is stored) and returns the raw token. */
export async function createResetToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });
  await prisma.passwordResetToken.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } });
  return token;
}

/** True if a link was requested in the last few minutes (avoids spamming someone's WhatsApp). */
export async function resetRecentlyRequested(userId: string, minutes = 10) {
  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId, usedAt: null, createdAt: { gte: new Date(Date.now() - minutes * 60000) } },
  });
  return Boolean(recent);
}
