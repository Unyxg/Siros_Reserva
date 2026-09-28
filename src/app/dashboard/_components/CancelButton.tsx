"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Loader2, X } from "lucide-react";
import { cancelReservation } from "@/app/actions/reservations";

export default function CancelButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="btn-secondary min-h-11 px-4 py-2 text-base">
        <X className="h-5 w-5" aria-hidden /> Cancelar
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-base font-semibold text-stone-700">¿Seguro?</span>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await cancelReservation(id);
            if (res.ok) toast.success(res.message);
            else toast.error(res.message);
            setConfirming(false);
          })
        }
        className="btn-danger min-h-11 px-4 py-2 text-base"
      >
        {pending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />} Sí, cancelar
      </button>
      <button onClick={() => setConfirming(false)} className="btn-secondary min-h-11 px-4 py-2 text-base">No</button>
    </div>
  );
}
