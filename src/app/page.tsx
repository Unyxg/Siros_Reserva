import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, LogIn, UserPlus } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { getCurrentUser, homeForRole } from "@/lib/session";

// Public welcome page (logged-in users go straight to their dashboard).
// It returns a real 200 page so crawlers such as Meta's domain verification can read it.
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <AuthShell title="Reserva la Palapa 🌴" subtitle="La forma fácil de apartar el área común de tu residencial.">
      <ul className="space-y-3 text-lg text-stone-700">
        <li className="flex items-start gap-3"><CalendarCheck className="mt-1 h-6 w-6 shrink-0 text-brand-600" aria-hidden /> Mira qué días están libres y pide tu fecha en 3 pasos.</li>
        <li className="flex items-start gap-3"><CalendarCheck className="mt-1 h-6 w-6 shrink-0 text-brand-600" aria-hidden /> Recibe la respuesta del comité por WhatsApp.</li>
      </ul>
      <div className="mt-8 grid gap-3">
        <Link href="/login" className="btn-primary w-full"><LogIn className="h-6 w-6" aria-hidden /> Iniciar sesión</Link>
        <Link href="/register" className="btn-secondary w-full"><UserPlus className="h-6 w-6" aria-hidden /> Crear cuenta</Link>
      </div>
    </AuthShell>
  );
}
