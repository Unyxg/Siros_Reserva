"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { registerUser } from "@/app/actions/auth";

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      name: String(f.get("name") ?? ""),
      email: String(f.get("email") ?? ""),
      house: String(f.get("house") ?? ""),
      phone: String(f.get("phone") ?? ""),
      password: String(f.get("password") ?? ""),
    };
    if (data.password !== f.get("confirm")) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const result = await registerUser(data);
    if (!result.ok) {
      setLoading(false);
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    // Log the new user in right away – one less step.
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
          <label htmlFor="phone" className="label">
            Teléfono <span className="font-normal text-stone-500">(opcional)</span>
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" placeholder="55 1234 5678" />
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
        {loading ? "Creando cuenta…" : "Crear mi cuenta"}
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
