"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { CalendarX2, Loader2, Trash2 } from "lucide-react";
import { blockDate, unblockDate } from "@/app/actions/admin";

export function BlockDateForm({ min, max }: { min: string; max: string }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await blockDate(date, reason);
          if (res.ok) {
            toast.success(res.message, { duration: 7000 });
            setDate("");
            setReason("");
          } else toast.error(res.message);
        });
      }}
      className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-end"
    >
      <div>
        <label htmlFor="bdate" className="label">Día</label>
        <input id="bdate" type="date" required min={min} max={max} value={date} onChange={(e) => setDate(e.target.value)} className="input" />
      </div>
      <div>
        <label htmlFor="breason" className="label">Motivo (lo verán los vecinos)</label>
        <input id="breason" required maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Ej. Mantenimiento, Posada del residencial…" />
      </div>
      <button disabled={pending} className="btn-primary">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <CalendarX2 className="h-5 w-5" aria-hidden />} Bloquear día
      </button>
    </form>
  );
}

export function UnblockButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await unblockDate(id);
          if (res.ok) toast.success(res.message);
          else toast.error(res.message);
        })
      }
      className="btn-secondary min-h-11 px-4 py-2 text-base"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Trash2 className="h-5 w-5" aria-hidden />} Desbloquear
    </button>
  );
}
