import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import LoginForm from "./LoginForm";
import { getCurrentUser, homeForRole } from "@/lib/session";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <AuthShell title="¡Hola de nuevo! 👋" subtitle="Entra con tu correo y contraseña para reservar la Palapa.">
      <LoginForm />
    </AuthShell>
  );
}
