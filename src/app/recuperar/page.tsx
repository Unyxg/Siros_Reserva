import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import ForgotForm from "./ForgotForm";
import { getContactWhatsapp } from "@/lib/settings";

export const metadata: Metadata = { title: "Recuperar contraseña" };
export const dynamic = "force-dynamic";

export default async function ForgotPage() {
  const contact = await getContactWhatsapp();
  return (
    <AuthShell title="¿Olvidaste tu contraseña?" subtitle="No pasa nada. Pide a la administración un enlace para crear una nueva; te llegará por WhatsApp.">
      <ForgotForm contact={contact} />
    </AuthShell>
  );
}
