import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

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
