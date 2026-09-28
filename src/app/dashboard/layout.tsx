import AppNav from "@/components/AppNav";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const pendingCount = user.role === "APPROVER" ? await prisma.reservation.count({ where: { status: "PENDING" } }) : 0;

  return (
    <>
      <AppNav name={user.name ?? "Vecino"} role={user.role} pendingCount={pendingCount} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="py-6 text-center text-base text-stone-500">
        ¿Dudas? Contacta a la administración de tu residencial.
      </footer>
    </>
  );
}
