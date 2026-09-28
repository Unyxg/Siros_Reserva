"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, MailCheck, Send } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    startTransition(async () => {
      const res = await requestPasswordReset(email);
      if (res.ok) setSent(true);
      else toast.error(res.message);
    });
  }

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <MailCheck className="mx-auto h-14 w-14 text-brand-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-extrabold text-stone-900">Revisa tu correo</h2>
        <p className="mt-2 text-lg text-stone-600">
          Si el correo está registrado, te llegará un enlace en unos minutos. Revisa también la carpeta de <em>spam</em>.
        </p>
        <Link href="/login" className="btn-secondary mt-6">Volver a Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="tucorreo@ejemplo.com" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Send className="h-6 w-6" aria-hidden />}
        Enviar enlace
      </button>
      <p className="text-center text-lg">
        <Link href="/login" className="font-bold text-brand-700 underline-offset-4 hover:underline">Volver a Iniciar sesión</Link>
      </p>
    </form>
  );
}
