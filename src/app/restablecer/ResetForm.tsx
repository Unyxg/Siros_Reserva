"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { KeyRound, Loader2 } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { resetPassword } from "@/app/actions/auth";

export default function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");
    if (password !== f.get("confirm")) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    startTransition(async () => {
      const res = await resetPassword(token, password);
      if (res.ok) {
        toast.success(res.message);
        router.replace("/login");
      } else toast.error(res.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="password" className="label">Nueva contraseña</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required placeholder="Mínimo 8 caracteres" />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Repite la contraseña</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} required placeholder="Escríbela otra vez" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <KeyRound className="h-6 w-6" aria-hidden />}
        Guardar contraseña
      </button>
    </form>
  );
}
