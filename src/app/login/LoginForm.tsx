"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { Loader2, LogIn } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);

    if (!res || res.error) {
      toast.error("Correo o contraseña incorrectos. Inténtalo de nuevo.");
      return;
    }
    toast.success("¡Bienvenido!");
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="tucorreo@ejemplo.com" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="Tu contraseña" />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <LogIn className="h-6 w-6" aria-hidden />}
        {loading ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-lg text-stone-600">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="font-bold text-brand-700 underline-offset-4 hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </form>
  );
}
