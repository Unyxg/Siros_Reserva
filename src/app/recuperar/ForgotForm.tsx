"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { forgotPasswordMessage, whatsappLink } from "@/lib/whatsapp";

export default function ForgotForm({ contact }: { contact: string | null }) {
  const [email, setEmail] = useState("");
  const link = whatsappLink(contact, forgotPasswordMessage(email.trim()));

  if (!link) {
    return (
      <div className="card p-6 text-lg text-stone-700">
        Comunícate con la administración de tu residencial para que te envíe un enlace y puedas crear una nueva contraseña.
        <Link href="/login" className="btn-secondary mt-6 w-full">Volver a Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="email" className="label">Tu correo (con el que entras)</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="tucorreo@ejemplo.com" />
      </div>
      <a href={link} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] text-white shadow-md shadow-green-600/20 hover:bg-[#1ebe5b]">
        <MessageCircle className="h-6 w-6" aria-hidden /> Pedir enlace por WhatsApp
      </a>
      <ol className="list-decimal space-y-1 pl-6 text-base text-stone-600">
        <li>Se abrirá WhatsApp con el mensaje listo; solo tócale enviar.</li>
        <li>La administración te responderá con un enlace.</li>
        <li>Ábrelo y elige tu nueva contraseña.</li>
      </ol>
      <p className="text-center text-lg">
        <Link href="/login" className="font-bold text-brand-700 underline-offset-4 hover:underline">Volver a Iniciar sesión</Link>
      </p>
    </div>
  );
}
