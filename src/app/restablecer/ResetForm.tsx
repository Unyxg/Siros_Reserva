"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { KeyRound, Loader2 } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { resetPassword } from "@/app/actions/auth";
import PasswordChecklist from "@/components/PasswordChecklist";
import { passwordProblem } from "@/lib/password-rules";

export default function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");
    const problem = passwordProblem(password);
    if (problem) {
      toast.error(problem);
      return;
    }
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
        <PasswordInput id="password" name="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Ej. Palapa2026" />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Repite la contraseña</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Escríbela otra vez" />
        <PasswordChecklist value={pw} confirm={pw2} />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <KeyRound className="h-6 w-6" aria-hidden />}
        Guardar contraseña
      </button>
    </form>
  );
}
