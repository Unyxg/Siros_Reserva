"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { reviewReservation } from "@/app/actions/reservations";
import { showResult } from "@/components/resultToast";

export default function ReviewActions({ id }: { id: string }) {
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"APPROVED" | "REJECTED" | null>(null);

  function submit(decision: "APPROVED" | "REJECTED") {
    setBusy(decision);
    startTransition(async () => {
      const res = await reviewReservation(id, decision, note);
      showResult(res, "Avisar al vecino por WhatsApp");
      setBusy(null);
    });
  }

  if (mode === "rejecting") {
    return (
      <div className="space-y-3">
        <label htmlFor={`note-${id}`} className="label">¿Por qué se rechaza? (el residente lo verá)</label>
        <textarea
          id={`note-${id}`}
          autoFocus
          rows={2}
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input resize-none"
          placeholder="Ej. Ese día hay mantenimiento del área."
        />
        <div className="flex flex-wrap gap-2">
          <button disabled={pending} onClick={() => submit("REJECTED")} className="btn-danger flex-1">
            {busy === "REJECTED" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <X className="h-5 w-5" aria-hidden />}
            Confirmar rechazo
          </button>
          <button disabled={pending} onClick={() => setMode("idle")} className="btn-secondary">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button disabled={pending} onClick={() => submit("APPROVED")} className="btn-primary">
        {busy === "APPROVED" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Check className="h-6 w-6" aria-hidden />}
        Aprobar
      </button>
      <button disabled={pending} onClick={() => setMode("rejecting")} className="btn-secondary border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50">
        <X className="h-6 w-6" aria-hidden /> Rechazar
      </button>
    </div>
  );
}
