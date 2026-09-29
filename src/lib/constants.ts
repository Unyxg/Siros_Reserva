import type { ReservationStatus, Role } from "@prisma/client";

// Community settings – tweak these to match the neighborhood rules.
export const TIMEZONE = "America/Mexico_City";
export const OPENING_HOUR = 8; // 08:00
export const CLOSING_HOUR = 22; // 22:00
export const SLOT_MINUTES = 30;
export const MAX_DAYS_AHEAD = 90;
export const MAX_GUESTS = 40;
export const MAX_HOURS = 12; // longest single reservation

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

export const ROLE_LABEL: Record<Role, string> = {
  USER: "Residente",
  APPROVER: "Aprobador",
  ADMIN: "Administrador",
};

/** All selectable times between opening and closing, e.g. ["08:00", "08:30", …, "22:00"]. */
export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let m = OPENING_HOUR * 60; m <= CLOSING_HOUR * 60; m += SLOT_MINUTES) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
})();
