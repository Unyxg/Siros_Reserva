import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addDaysISO, formatLongDate, todayISO } from "@/lib/format";
import { MAX_DAYS_AHEAD } from "@/lib/constants";
import { BlockDateForm, UnblockButton } from "./BlockDateForm";

export const metadata: Metadata = { title: "Días cerrados" };

export default async function BlockedDatesPage() {
  await requireUser(["ADMIN"]);
  const today = todayISO();
  const [blocked, booked] = await Promise.all([
    prisma.blockedDate.findMany({ where: { date: { gte: today } }, orderBy: { date: "asc" } }),
    prisma.reservation.groupBy({ by: ["date"], where: { date: { gte: today }, status: { in: ["PENDING", "APPROVED"] } }, _count: { _all: true } }),
  ]);
  const bookedMap = new Map(booked.map((b) => [b.date, b._count._all]));

  return (
    <>
      <PageHeader title="Días cerrados" subtitle="Bloquea días por mantenimiento, fiestas del residencial o días festivos. Nadie podrá reservarlos." />

      <section className="card p-5 sm:p-6">
        <BlockDateForm min={today} max={addDaysISO(today, MAX_DAYS_AHEAD * 2)} />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-stone-900">Próximos días cerrados</h2>
        {blocked.length === 0 ? (
          <div className="card mt-4 p-8 text-center text-lg text-stone-500">No hay días bloqueados.</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {blocked.map((b) => (
              <li key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                <span>
                  <span className="block text-lg font-bold text-stone-900">{formatLongDate(b.date)}</span>
                  <span className="block text-base text-stone-600">{b.reason}</span>
                  {bookedMap.get(b.date) ? (
                    <span className="mt-1 flex items-center gap-1.5 text-base font-semibold text-amber-800">
                      <AlertTriangle className="h-4 w-4" aria-hidden /> Hay {bookedMap.get(b.date)} reservación(es) ese día. Cancélalas desde “Por aprobar”.
                    </span>
                  ) : null}
                </span>
                <UnblockButton id={b.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
