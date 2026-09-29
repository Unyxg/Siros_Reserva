import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/password-rules";

/** Live checklist under a new-password field; each rule turns green as it is met. */
export default function PasswordChecklist({ value, confirm }: { value: string; confirm?: string }) {
  const items = [
    ...PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, ok: r.test(value) })),
    ...(confirm !== undefined ? [{ id: "match", label: "Las dos contraseñas coinciden", ok: value.length > 0 && value === confirm }] : []),
  ];
  return (
    <ul className="mt-2 grid gap-1 text-base sm:grid-cols-2" aria-label="Requisitos de la contraseña">
      {items.map((i) => (
        <li key={i.id} className={`flex items-center gap-2 ${i.ok ? "font-semibold text-emerald-700" : "text-stone-500"}`}>
          {i.ok ? <Check className="h-5 w-5" aria-hidden /> : <Circle className="h-4 w-4" aria-hidden />}
          {i.label}
          <span className="sr-only">{i.ok ? "(cumplido)" : "(pendiente)"}</span>
        </li>
      ))}
    </ul>
  );
}
