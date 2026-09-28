"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { CalendarPlus, ClipboardCheck, LayoutDashboard, LogOut, Palmtree } from "lucide-react";
import { ROLE_LABEL } from "@/lib/constants";

type NavItem = { href: string; label: string; icon: React.ElementType; roles: Role[] };

// Every role can request the Palapa; extra sections appear based on the role.
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Reservar", icon: CalendarPlus, roles: ["USER", "APPROVER", "ADMIN"] },
  { href: "/dashboard/aprobador", label: "Por aprobar", icon: ClipboardCheck, roles: ["APPROVER"] },
  { href: "/dashboard/admin", label: "Panel general", icon: LayoutDashboard, roles: ["ADMIN"] },
];

export default function AppNav({ name, role, pendingCount }: { name: string; role: Role; pendingCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((i) => i.roles.includes(role));
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  async function logout() {
    await signOut({ redirect: false });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
            <Palmtree className="h-6 w-6" aria-hidden />
          </span>
          <span className="hidden text-xl font-extrabold text-stone-900 sm:block">Reserva la Palapa</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Principal">
          {items.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} badge={item.href === "/dashboard/aprobador" ? pendingCount : 0} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-4">
          <div className="hidden text-right leading-tight sm:block">
            <p className="font-bold text-stone-900">{name}</p>
            <p className="text-sm font-semibold text-brand-700">{ROLE_LABEL[role]}</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-100 font-extrabold text-amber-800" aria-hidden>
            {initials}
          </span>
          <button onClick={logout} className="btn-secondary min-h-11 px-3 py-2 text-base" title="Cerrar sesión">
            <LogOut className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Mobile: big, thumb-friendly tabs */}
      {items.length > 1 && (
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden" aria-label="Principal móvil">
          {items.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} badge={item.href === "/dashboard/aprobador" ? pendingCount : 0} />
          ))}
        </nav>
      )}
    </header>
  );
}

function NavLink({ item, active, badge }: { item: NavItem; active: boolean; badge: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-base font-bold transition ${
        active ? "bg-brand-50 text-brand-800 ring-2 ring-brand-200" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {item.label}
      {badge > 0 && (
        <span className="grid min-w-6 place-items-center rounded-full bg-amber-500 px-1.5 text-sm font-extrabold text-white">{badge}</span>
      )}
    </Link>
  );
}
