"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/auth";
import { forgotPasswordMessage, whatsappLink } from "@/lib/whatsapp";

const green = "btn w-full bg-[#25D366] text-white shadow-md shadow-green-600/20 hover:bg-[#1ebe5b]";

export default function ForgotForm({ contact, auto }: { contact: string | null; auto: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const manualLink = whatsappLink(contact, forgotPasswordMessage(email.trim()));

  const back = (
    <p className="text-center text-lg">
      <Link href="/login" className="font-bold text-brand-700 underline-offset-4 hover:underline">Volver a Iniciar sesión</Link>
    </p>
  );

  if (sent) {
    return (
      <div className="card space-y-4 p-8 text-center">
        <MessageCircle className="mx-auto h-14 w-14 text-[#25D366]" aria-hidden />
        <h2 className="text-2xl font-extrabold text-stone-900">Revisa tu WhatsApp</h2>
        <p className="text-lg text-stone-600">Si el correo está registrado, te llegará un mensaje con el botón “Crear contraseña” en unos segundos.</p>
        {manualLink && (
          <p className="text-base text-stone-500">
            ¿No te llegó?{" "}
            <a href={manualLink} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-700 underline">Pide ayuda a la administración</a>.
          </p>
        )}
        {back}
      </div>
    );
  }

  if (auto) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const res = await requestPasswordReset(email);
            if (res.ok) setSent(true);
            else toast.error(res.message);
          });
        }}
        className="space-y-5"
      >
        <div>
          <label htmlFor="email" className="label">Tu correo (con el que entras)</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="tucorreo@ejemplo.com" />
        </div>
        <button type="submit" disabled={pending} className={green}>
          {pending ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Send className="h-6 w-6" aria-hidden />} Enviarme el enlace por WhatsApp
        </button>
        {back}
      </form>
    );
  }

  if (!manualLink) {
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
      <a href={manualLink} target="_blank" rel="noopener noreferrer" className={green}>
        <MessageCircle className="h-6 w-6" aria-hidden /> Pedir enlace por WhatsApp
      </a>
      <ol className="list-decimal space-y-1 pl-6 text-base text-stone-600">
        <li>Se abrirá WhatsApp con el mensaje listo; solo tócale enviar.</li>
        <li>La administración te responderá con un enlace.</li>
        <li>Ábrelo y elige tu nueva contraseña.</li>
      </ol>
      {back}
    </div>
  );
}
