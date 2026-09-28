import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, ReservationStatus } from "@prisma/client";
import { CalendarCheck, CheckCircle2, Clock, Search, Users, XCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import AutoRefresh from "@/components/AutoRefresh";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatLongDate, formatShortDate, formatTime, todayISO } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Panel general" };

const FILTERS: { key: "ALL" | ReservationStatus; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "PENDING", label: "Pendientes" },
  { key: "APPROVED", label: "Aprobadas" },
  { key: "REJECTED", label: "Rechazadas" },
  { key: "CANCELLED", label: "Canceladas" },
];

export default async function AdminDashboard({ searchParams }: PageProps<"/dashboard/admin">) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const statusParam = typeof sp.estado === "string" ? sp.estado.toUpperCase() : "ALL";
  const status = FILTERS.some((f) => f.key === statusParam) ? (statusParam as (typeof FILTERS)[number]["key"]) : "ALL";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const today = todayISO();

  const where: Prisma.ReservationWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(q ? { OR: [{ reason: { contains: q } }, { user: { name: { contains: q } } }, { user: { house: { contains: q } } }] } : {}),
  };

  const [grouped, userCount, rows, upcoming] = await Promise.all([
    prisma.reservation.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.count(),
    prisma.reservation.findMany({
      where,
      include: { user: { select: { name: true, house: true } }, reviewedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.reservation.findMany({
      where: { status: "APPROVED", date: { gte: today } },
      include: { user: { select: { name: true, house: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<ReservationStatus, number>>;
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const reviewed = (counts.APPROVED ?? 0) + (counts.REJECTED ?? 0);
  const approvalRate = reviewed ? Math.round(((counts.APPROVED ?? 0) / reviewed) * 100) : 0;

  const stats = [
    { label: "Pendientes", value: counts.PENDING ?? 0, icon: Clock, cls: "bg-amber-100 text-amber-800" },
    { label: "Aprobadas", value: counts.APPROVED ?? 0, icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-800" },
    { label: "Rechazadas", value: counts.REJECTED ?? 0, icon: XCircle, cls: "bg-rose-100 text-rose-800" },
    { label: "Vecinos registrados", value: userCount, icon: Users, cls: "bg-sky-100 text-sky-800" },
  ];

  const bar: { status: ReservationStatus; cls: string }[] = [
    { status: "APPROVED", cls: "bg-emerald-500" },
    { status: "PENDING", cls: "bg-amber-400" },
    { status: "REJECTED", cls: "bg-rose-500" },
    { status: "CANCELLED", cls: "bg-stone-300" },
  ];

  const hrefFor = (key: string) => {
    const p = new URLSearchParams();
    if (key !== "ALL") p.set("estado", key.toLowerCase());
    if (q) p.set("q", q);
    const s = p.toString();
    return `/dashboard/admin${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader title="Panel general" subtitle="Toda la actividad de la Palapa en un solo lugar (solo lectura)." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${s.cls}`}>
              <s.icon className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-4 text-4xl font-extrabold text-stone-900">{s.value}</p>
            <p className="text-base font-semibold text-stone-600">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Distribution */}
        <section className="card p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-extrabold text-stone-900">Resumen de solicitudes</h2>
            <p className="text-base text-stone-500">{total} en total</p>
          </div>
          <div className="mt-5 flex h-5 overflow-hidden rounded-full bg-stone-100" role="img" aria-label="Distribución de solicitudes por estado">
            {total > 0 &&
              bar.map((b) => {
                const pct = ((counts[b.status] ?? 0) / total) * 100;
                return pct > 0 ? <div key={b.status} className={`${b.cls} border-r-2 border-white last:border-r-0`} style={{ width: `${pct}%` }} /> : null;
              })}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-base sm:grid-cols-4">
            {bar.map((b) => (
              <li key={b.status} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${b.cls}`} />
                <span className="text-stone-700">{STATUS_LABEL[b.status]}</span>
                <strong className="ml-auto text-stone-900 sm:ml-0">{counts[b.status] ?? 0}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-2xl bg-brand-50 px-4 py-3 text-lg text-brand-900">
            Tasa de aprobación: <strong>{approvalRate}%</strong> de las solicitudes revisadas.
          </p>
        </section>

        {/* Upcoming events */}
        <section className="card p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-stone-900">
            <CalendarCheck className="h-6 w-6 text-brand-600" aria-hidden /> Próximos eventos
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-lg text-stone-500">No hay eventos aprobados próximamente.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((r) => (
                <li key={r.id} className="flex items-center gap-4 rounded-2xl bg-stone-50 p-3">
                  <span className="grid w-16 shrink-0 place-items-center rounded-xl bg-white py-1.5 text-center font-extrabold leading-tight text-brand-700 ring-1 ring-stone-200">
                    {formatShortDate(r.date)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-stone-900">{r.user.name}</span>
                    <span className="block text-base text-stone-600">{formatTime(r.startTime)} – {formatTime(r.endTime)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Full activity log */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-stone-900">Toda la actividad</h2>
          <form className="relative w-full sm:w-80" action="/dashboard/admin">
            {status !== "ALL" && <input type="hidden" name="estado" value={status.toLowerCase()} />}
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden />
            <input name="q" defaultValue={q} className="input pl-12" placeholder="Buscar vecino, casa o motivo…" aria-label="Buscar" />
          </form>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por estado">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={hrefFor(f.key)}
              aria-current={status === f.key ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-base font-bold transition ${
                status === f.key ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <div className="card mt-4 p-10 text-center text-lg text-stone-500">No hay solicitudes con estos filtros.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card mt-4 hidden overflow-hidden md:block">
              <table className="w-full text-left text-base">
                <thead className="bg-stone-50 text-sm font-bold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-3">Vecino</th>
                    <th className="px-5 py-3">Fecha y horario</th>
                    <th className="px-5 py-3">Motivo</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Revisó</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="align-top hover:bg-stone-50/60">
                      <td className="px-5 py-4">
                        <p className="font-bold text-stone-900">{r.user.name}</p>
                        <p className="text-stone-500">{r.user.house}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-stone-800">{formatLongDate(r.date)}</p>
                        <p className="text-stone-500">{formatTime(r.startTime)} – {formatTime(r.endTime)}</p>
                      </td>
                      <td className="max-w-xs px-5 py-4 text-stone-700">
                        {r.reason}
                        {r.guests && <span className="block text-stone-500">{r.guests} personas</span>}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-4 text-stone-600">
                        {r.reviewedBy ? (
                          <>
                            <p>{r.reviewedBy.name}</p>
                            {r.reviewedAt && <p className="text-sm text-stone-400">{formatDateTime(r.reviewedAt)}</p>}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="mt-4 space-y-3 md:hidden">
              {rows.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-stone-900">{r.user.name} <span className="font-normal text-stone-500">· {r.user.house}</span></p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 text-stone-700">{formatLongDate(r.date)} · {formatTime(r.startTime)} – {formatTime(r.endTime)}</p>
                  <p className="text-stone-600">{r.reason}</p>
                  {r.reviewedBy && <p className="mt-1 text-sm text-stone-500">Revisó: {r.reviewedBy.name}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
