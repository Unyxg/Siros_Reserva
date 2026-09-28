import AppNav from "@/components/AppNav";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const staff = user.role === "APPROVER" || user.role === "ADMIN";
  const [reservations, accounts] = await Promise.all([
    staff ? prisma.reservation.count({ where: { status: "PENDING" } }) : 0,
    user.role === "ADMIN" ? prisma.user.count({ where: { status: "PENDING" } }) : 0,
  ]);

  return (
    <>
      <AppNav name={user.name} role={user.role} counts={{ reservations, accounts }} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="py-6 text-center text-base text-stone-500">
        ¿Dudas? Contacta a la administración de tu residencial.
      </footer>
    </>
  );
}
