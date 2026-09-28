"use client";

import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { Check, KeyRound, Loader2, LockKeyhole, MessageCircle, Power, Send, X } from "lucide-react";
import { approveAccount, changeRole, createPasswordResetLink, rejectAccount, setAccountActive, testWhatsappCloud, updateContactWhatsapp, updateInviteCode } from "@/app/actions/admin";
import { showResult } from "@/components/resultToast";
import type { ActionResult } from "@/app/actions/auth";

function useAction(whatsappLabel?: string) {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      showResult(await fn(), whatsappLabel);
    });
  return { pending, run };
}

export function PendingAccountActions({ id }: { id: string }) {
  const { pending, run } = useAction("Avisarle por WhatsApp");
  return (
    <div className="grid grid-cols-2 gap-2">
      <button disabled={pending} onClick={() => run(() => approveAccount(id))} className="btn-primary min-h-11 py-2 text-base">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Check className="h-5 w-5" aria-hidden />} Aprobar
      </button>
      <button
        disabled={pending}
        onClick={() => confirm("¿Rechazar esta cuenta? Se borrará la solicitud.") && run(() => rejectAccount(id))}
        className="btn-secondary min-h-11 py-2 text-base text-rose-700"
      >
        <X className="h-5 w-5" aria-hidden /> Rechazar
      </button>
    </div>
  );
}

const ROLES: { value: Role; label: string }[] = [
  { value: "USER", label: "Residente" },
  { value: "APPROVER", label: "Aprobador" },
  { value: "ADMIN", label: "Administrador" },
];

export function RoleSelect({ id, role, disabled }: { id: string; role: Role; disabled?: boolean }) {
  const { pending, run } = useAction();
  return (
    <select
      aria-label="Rol"
      defaultValue={role}
      disabled={disabled || pending}
      onChange={(e) => run(() => changeRole(id, e.target.value as Role))}
      className="input min-h-11 py-2 text-base"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}

export function ActiveToggle({ id, active, disabled }: { id: string; active: boolean; disabled?: boolean }) {
  const { pending, run } = useAction();
  return (
    <button
      disabled={disabled || pending}
      onClick={() => run(() => setAccountActive(id, !active))}
      className={`btn-secondary min-h-11 px-3 py-2 text-base ${active ? "text-stone-700" : "text-brand-700"}`}
    >
      <Power className="h-5 w-5" aria-hidden /> {active ? "Desactivar" : "Reactivar"}
    </button>
  );
}

export function InviteCodeForm({ code }: { code: string }) {
  const [value, setValue] = useState(code);
  const { pending, run } = useAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateInviteCode(value));
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="min-w-48 flex-1">
        <label htmlFor="invite" className="label flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-600" aria-hidden /> Código de invitación actual
        </label>
        <input id="invite" value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} className="input font-mono tracking-widest" />
      </div>
      <button disabled={pending || value === code} className="btn-primary">
        {pending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />} Cambiar código
      </button>
    </form>
  );
}

/** Creates a one-time link to set a new password and offers to send it by WhatsApp. */
export function ResetPasswordButton({ id }: { id: string }) {
  const { pending, run } = useAction("Enviar enlace por WhatsApp");
  return (
    <button
      disabled={pending}
      onClick={() => run(() => createPasswordResetLink(id))}
      className="btn-secondary min-h-11 px-3 py-2 text-base"
      title="Crear enlace para nueva contraseña"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <LockKeyhole className="h-5 w-5" aria-hidden />}
      <span className="sr-only sm:not-sr-only">Contraseña</span>
    </button>
  );
}

export function ContactWhatsappForm({ phone }: { phone: string }) {
  const [value, setValue] = useState(phone);
  const { pending, run } = useAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateContactWhatsapp(value));
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="min-w-48 flex-1">
        <label htmlFor="contact" className="label flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#25D366]" aria-hidden /> WhatsApp de la administración
        </label>
        <input id="contact" type="tel" inputMode="tel" value={value} onChange={(e) => setValue(e.target.value)} className="input" placeholder="55 1234 5678" />
        <p className="mt-1 text-base text-stone-500">Aquí te escriben los vecinos nuevos y quien olvidó su contraseña.</p>
      </div>
      <button disabled={pending || value === phone} className="btn-primary">
        {pending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />} Guardar
      </button>
    </form>
  );
}

export function TestWhatsappButton() {
  const { pending, run } = useAction();
  return (
    <button disabled={pending} onClick={() => run(testWhatsappCloud)} className="btn-secondary min-h-11 px-4 py-2 text-base">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />} Enviar mensaje de prueba
    </button>
  );
}
