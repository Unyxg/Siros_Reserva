"use client";

import { useState, useTransition } from "react";
import { Ban, Loader2 } from "lucide-react";
import { cancelReservation } from "@/app/actions/reservations";
import { showResult } from "@/components/resultToast";

/** Staff cancels an approved booking (reason required) so the slot opens up again. */
export default function StaffCancelButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary min-h-11 px-4 py-2 text-base text-rose-700">
        <Ban className="h-5 w-5" aria-hidden /> Cancelar
      </button>
    );

  return (
    <div className="w-full space-y-2">
      <label htmlFor={`cancel-${id}`} className="label">Motivo de la cancelación (lo verá el vecino)</label>
      <input id={`cancel-${id}`} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} className="input" placeholder="Ej. Reparación urgente del techo" />
      <div className="flex flex-wrap gap-2">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await cancelReservation(id, reason);
              showResult(res, "Avisar al vecino por WhatsApp");
            })
          }
          className="btn-danger min-h-11 px-4 py-2 text-base"
        >
          {pending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />} Confirmar cancelación
        </button>
        <button disabled={pending} onClick={() => setOpen(false)} className="btn-secondary min-h-11 px-4 py-2 text-base">Volver</button>
      </div>
    </div>
  );
}
