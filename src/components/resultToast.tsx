"use client";

import toast from "react-hot-toast";
import { MessageCircle, X } from "lucide-react";
import type { ActionResult } from "@/app/actions/auth";

/**
 * Shows the result of a server action. When the action returns a WhatsApp link,
 * a card with a big green button stays on screen so the person can send the notice.
 */
export function showResult(res: ActionResult, whatsappLabel = "Avisar por WhatsApp") {
  if (!res.ok) {
    toast.error(res.message);
    return;
  }
  if (!res.whatsapp) {
    toast.success(res.message);
    return;
  }
  const link = res.whatsapp;
  toast.custom(
    (t) => (
      <div className={`w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-stone-200 ${t.visible ? "" : "opacity-0"}`}>
        <div className="flex items-start gap-3">
          <p className="flex-1 text-lg font-bold text-stone-900">✅ {res.message}</p>
          <button onClick={() => toast.dismiss(t.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100" aria-label="Cerrar">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => toast.dismiss(t.id)}
          className="btn mt-3 w-full bg-[#25D366] text-white shadow-md shadow-green-600/20 hover:bg-[#1ebe5b]"
        >
          <MessageCircle className="h-6 w-6" aria-hidden /> {whatsappLabel}
        </a>
      </div>
    ),
    // Bottom of the screen: easy to reach with the thumb and never covered by other notices
    { duration: 20000, position: "bottom-center" },
  );
}
