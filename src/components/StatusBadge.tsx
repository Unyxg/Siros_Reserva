import type { ReservationStatus } from "@prisma/client";
import { CheckCircle2, Clock, Ban, XCircle } from "lucide-react";
import { STATUS_LABEL } from "@/lib/constants";

// Color + icon + text, so the status is clear even for color-blind users.
const STYLES: Record<ReservationStatus, { cls: string; icon: React.ElementType }> = {
  PENDING: { cls: "bg-amber-100 text-amber-900 ring-amber-300", icon: Clock },
  APPROVED: { cls: "bg-emerald-100 text-emerald-900 ring-emerald-300", icon: CheckCircle2 },
  REJECTED: { cls: "bg-rose-100 text-rose-900 ring-rose-300", icon: XCircle },
  CANCELLED: { cls: "bg-stone-100 text-stone-700 ring-stone-300", icon: Ban },
};

export default function StatusBadge({ status }: { status: ReservationStatus }) {
  const { cls, icon: Icon } = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-bold ring-1 ring-inset ${cls}`}>
      <Icon className="h-4.5 w-4.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
