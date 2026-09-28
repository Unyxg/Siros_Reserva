import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Current user, re-read from the database on every request so role changes
 * or deactivated accounts take effect immediately (not only at next login).
 */
export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, status: true, house: true, phone: true },
  });
  return user?.status === "ACTIVE" ? user : null;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export const isStaff = (role: Role) => role === "APPROVER" || role === "ADMIN";

/** Where each role lands after logging in. */
export function homeForRole(role: Role) {
  if (role === "APPROVER") return "/dashboard/aprobador";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard";
}

/** Server-side guard: redirects to /login (or the user's home) when not allowed. */
export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}
