import type { Metadata } from "next";
import { Home, Mail, Phone, UserCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WhatsAppButton from "@/components/WhatsAppButton";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getContactWhatsapp, getInviteCode } from "@/lib/settings";
import { appUrl } from "@/lib/app-url";
import { whatsappLink, whatsappShareLink } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/constants";
import { ActiveToggle, ContactWhatsappForm, InviteCodeForm, PendingAccountActions, ResetPasswordButton, RoleSelect, TestWhatsappButton } from "./UserControls";
import { cloudEnabled, getSenderInfo } from "@/lib/whatsapp-cloud";

export const metadata: Metadata = { title: "Vecinos" };

export default async function UsersPage() {
  const me = await requireUser(["ADMIN"]);
  const [users, code, contact, sender] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ status: "asc" }, { name: "asc" }], include: { _count: { select: { reservations: true } } } }),
    getInviteCode(),
    getContactWhatsapp(),
    getSenderInfo(),
  ]);
  const pending = users.filter((u) => u.status === "PENDING");
  const others = users.filter((u) => u.status !== "PENDING");

  const inviteMsg = `¡Hola! Ya puedes apartar la Palapa en línea 🌴\n1. Entra a ${appUrl("/register")}\n2. Usa el código de invitación: *${code}*\nLa administración aprobará tu cuenta.`;

  return (
    <>
      <PageHeader title="Vecinos y permisos" subtitle="Aprueba cuentas nuevas, asigna aprobadores y administra el código de invitación." />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <InviteCodeForm code={code} />
          <div className="mt-4 flex flex-wrap items-center gap-3 text-base text-stone-600">
            <span>Compártelo con los vecinos:</span>
            <WhatsAppButton href={whatsappShareLink(inviteMsg)} label="Compartir invitación" />
          </div>
        </div>
        <div className="card p-5 sm:p-6">
          <ContactWhatsappForm phone={contact ?? ""} />
          {!contact && <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-2.5 text-base font-semibold text-amber-900">⚠️ Agrega un número para que los vecinos puedan contactarte.</p>}
        </div>
      </section>

      <section className={`card mt-5 flex flex-wrap items-center gap-4 p-5 sm:p-6 ${cloudEnabled() ? "border-l-8 border-l-[#25D366]" : "border-l-8 border-l-stone-300"}`}>
        <div className="min-w-60 flex-1">
          <p className="text-lg font-extrabold text-stone-900">
            WhatsApp automático: {cloudEnabled() ? <span className="text-emerald-700">activado ✅</span> : <span className="text-stone-500">no configurado</span>}
          </p>
          <p className="text-base text-stone-600">
            {cloudEnabled()
              ? "Los avisos se envían solos por la API de WhatsApp de Meta. Si un envío falla, aparece el botón verde para mandarlo a mano."
              : "Los avisos se mandan con el botón verde (gratis). Para enviarlos solos, agrega las claves de Meta en Vercel."}
          </p>
          {sender && (
            <p className="mt-1 text-base font-semibold text-stone-800">
              {sender.number ? (
                <>Se envían desde: {sender.number} · {sender.name}</>
              ) : (
                <span className="text-rose-700">No se pudo leer el número configurado (ID {sender.id}): {sender.error}</span>
              )}
            </p>
          )}
        </div>
        {cloudEnabled() && <TestWhatsappButton />}
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-stone-900">
          <UserCheck className="h-7 w-7 text-amber-500" aria-hidden /> Cuentas por aprobar
          {pending.length > 0 && <span className="rounded-full bg-amber-500 px-2.5 text-lg text-white">{pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <div className="card mt-4 p-8 text-center text-lg text-stone-500">No hay cuentas nuevas esperando aprobación.</div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {pending.map((u) => (
              <article key={u.id} className="card border-l-8 border-l-amber-400 p-5">
                <p className="text-xl font-extrabold text-stone-900">{u.name}</p>
                <div className="mt-2 space-y-1 text-lg text-stone-700">
                  <p className="flex items-center gap-2"><Home className="h-5 w-5 text-stone-400" aria-hidden /> {u.house ?? "—"}</p>
                  <p className="flex items-center gap-2"><Mail className="h-5 w-5 text-stone-400" aria-hidden /> {u.email}</p>
                  {u.phone && <p className="flex items-center gap-2"><Phone className="h-5 w-5 text-stone-400" aria-hidden /> {u.phone}</p>}
                </div>
                <p className="mt-2 text-sm text-stone-500">Se registró el {formatDateTime(u.createdAt)}</p>
                <p className="mt-1 text-base text-stone-600">Confirma que sí vive en el residencial antes de aprobar.</p>
                <div className="mt-4">
                  <PendingAccountActions id={u.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-stone-900">Todos los vecinos ({others.length})</h2>
        <p className="mt-1 text-lg text-stone-600">Para nombrar a un aprobador, cambia su rol a “Aprobador”.</p>
        <ul className="mt-4 space-y-3">
          {others.map((u) => {
            const self = u.id === me.id;
            return (
              <li key={u.id} className={`card flex flex-wrap items-center gap-4 p-4 sm:p-5 ${u.status === "DISABLED" ? "opacity-60" : ""}`}>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold text-stone-900">
                    {u.name} {self && <span className="text-base font-semibold text-brand-700">(tú)</span>}
                    {u.status === "DISABLED" && <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-sm font-bold text-stone-700">Desactivada</span>}
                  </span>
                  <span className="block text-base text-stone-600">
                    {u.house ?? "—"} · {u.email} · {u._count.reservations} reservación(es)
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <WhatsAppButton compact label="WhatsApp" href={whatsappLink(u.phone, `Hola ${u.name.split(" ")[0]}, te escribe la administración del residencial.`)} />
                  <span className="w-44">
                    <RoleSelect id={u.id} role={u.role} disabled={self} />
                  </span>
                  <ResetPasswordButton id={u.id} />
                  <ActiveToggle id={u.id} active={u.status === "ACTIVE"} disabled={self} />
                </span>
                <span className="sr-only">Rol actual: {ROLE_LABEL[u.role]}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
