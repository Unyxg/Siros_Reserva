import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import ForgotForm from "./ForgotForm";
import { getContactWhatsapp } from "@/lib/settings";
import { cloudEnabled } from "@/lib/whatsapp-cloud";

export const metadata: Metadata = { title: "Recuperar contraseña" };
export const dynamic = "force-dynamic";

export default async function ForgotPage() {
  const auto = cloudEnabled();
  return (
    <AuthShell
      title="¿Olvidaste tu contraseña?"
      subtitle={
        auto
          ? "No pasa nada. Escribe tu correo y te mandaremos por WhatsApp un enlace para crear una nueva."
          : "No pasa nada. Pide a la administración un enlace para crear una nueva; te llegará por WhatsApp."
      }
    >
      <ForgotForm contact={await getContactWhatsapp()} auto={auto} />
    </AuthShell>
  );
}
