import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPage() {
  return (
    <AuthShell title="¿Olvidaste tu contraseña?" subtitle="Escribe tu correo y te enviaremos un enlace para crear una nueva.">
      <ForgotForm />
    </AuthShell>
  );
}
