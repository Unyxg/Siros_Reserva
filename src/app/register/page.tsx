import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "./RegisterForm";
import { getCurrentUser, homeForRole } from "@/lib/session";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Solo te tomará un minuto. Necesitas el código de invitación de tu residencial.">
      <RegisterForm />
    </AuthShell>
  );
}
