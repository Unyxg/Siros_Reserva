import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import ResetForm from "./ResetForm";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function ResetPage({ searchParams }: PageProps<"/restablecer">) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Crea tu nueva contraseña" subtitle="Elige una contraseña que puedas recordar, de al menos 8 caracteres.">
      {typeof token === "string" && token ? (
        <ResetForm token={token} />
      ) : (
        <p className="text-lg text-stone-600">
          El enlace no es válido. <Link href="/recuperar" className="font-bold text-brand-700 underline">Pide uno nuevo</Link> a la administración.
        </p>
      )}
    </AuthShell>
  );
}
