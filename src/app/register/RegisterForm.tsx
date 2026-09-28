"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Hourglass, KeyRound, Loader2, UserPlus } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { registerUser } from "@/app/actions/auth";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      name: String(f.get("name") ?? ""),
      email: String(f.get("email") ?? ""),
      house: String(f.get("house") ?? ""),
      phone: String(f.get("phone") ?? ""),
      password: String(f.get("password") ?? ""),
      inviteCode: String(f.get("inviteCode") ?? ""),
    };
    if (data.password !== f.get("confirm")) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const result = await registerUser(data);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("¡Cuenta registrada!");
    setDone(true);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <Hourglass className="mx-auto h-14 w-14 text-amber-500" aria-hidden />
        <h2 className="mt-4 text-2xl font-extrabold text-stone-900">Tu cuenta está en revisión</h2>
        <p className="mt-2 text-lg text-stone-600">
          La administración confirmará que eres vecino del residencial. Te enviaremos un correo cuando puedas entrar.
        </p>
        <Link href="/login" className="btn-secondary mt-6">Volver a Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <label htmlFor="inviteCode" className="label flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-600" aria-hidden /> Código de invitación
        </label>
        <input id="inviteCode" name="inviteCode" required autoCapitalize="characters" className="input uppercase" placeholder="Te lo da la administración" />
      </div>
      <div>
        <label htmlFor="name" className="label">Nombre completo</label>
        <input id="name" name="name" autoComplete="name" required className="input" placeholder="Ej. Juan Pérez" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="house" className="label">Casa / Depto.</label>
          <input id="house" name="house" required className="input" placeholder="Ej. Casa 14" />
        </div>
        <div>
          <label htmlFor="phone" className="label">WhatsApp</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="input" placeholder="55 1234 5678" />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="tucorreo@ejemplo.com" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required placeholder="Mínimo 8 caracteres" />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Repite la contraseña</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} required placeholder="Escríbela otra vez" />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <UserPlus className="h-6 w-6" aria-hidden />}
        {loading ? "Enviando…" : "Crear mi cuenta"}
      </button>

      <p className="text-center text-lg text-stone-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-brand-700 underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
