import type { Metadata } from "next";
import Link from "next/link";
import { Palmtree } from "lucide-react";
import { getContactWhatsapp } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Aviso de privacidad" };
export const dynamic = "force-dynamic";

const UPDATED = "28 de septiembre de 2026";

/** Public privacy notice (also used as the Privacy Policy URL for Meta / WhatsApp). */
export default async function PrivacyPage() {
  const contact = await getContactWhatsapp();
  const deleteLink = whatsappLink(contact, "Hola, quiero que eliminen mi cuenta y mis datos de la app de reservaciones de la Palapa. Mi correo es: ");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white">
          <Palmtree className="h-6 w-6" aria-hidden />
        </span>
        <span className="text-xl font-extrabold text-stone-900">Reserva la Palapa</span>
      </Link>

      <article className="card mt-8 space-y-6 p-6 text-lg leading-relaxed text-stone-700 sm:p-10 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-stone-900 [&_li]:ml-6 [&_li]:list-disc">
        <header>
          <h1 className="text-3xl font-extrabold text-stone-900 sm:text-4xl">Aviso de privacidad</h1>
          <p className="mt-2 text-base text-stone-500">Última actualización: {UPDATED}</p>
        </header>

        <p>
          La administración del residencial Siros (“la administración”) es responsable de los datos personales que se usan en la app
          “Reserva la Palapa”, que sirve para solicitar y aprobar el uso del área común (Palapa) del residencial.
        </p>

        <h2>Qué datos usamos</h2>
        <ul>
          <li>Nombre completo, número de casa o departamento, correo electrónico y número de teléfono (WhatsApp).</li>
          <li>Tu contraseña, guardada de forma cifrada (nadie puede verla).</li>
          <li>Tus solicitudes de reservación: fecha, horario, número de personas, motivo y su estado.</li>
        </ul>

        <h2>Para qué los usamos</h2>
        <ul>
          <li>Confirmar que eres vecino del residencial y darte acceso a la app.</li>
          <li>Registrar, revisar, aprobar, rechazar o cancelar reservaciones de la Palapa.</li>
          <li>Avisarte por WhatsApp sobre tu cuenta y tus reservaciones, y enviarte enlaces para cambiar tu contraseña.</li>
          <li>Llevar un registro del uso del área común para la administración del residencial.</li>
        </ul>
        <p>No usamos tus datos para publicidad y no los vendemos ni los compartimos con otras personas o empresas para otros fines.</p>

        <h2>Quién más los procesa</h2>
        <p>Para que la app funcione usamos estos servicios, que procesan los datos solo por cuenta de la administración:</p>
        <ul>
          <li>Meta (WhatsApp Business Platform), para enviar los avisos por WhatsApp.</li>
          <li>Vercel, que aloja la app, y Turso, que guarda la base de datos.</li>
        </ul>
        <p>Los vecinos con rol de aprobador o administrador pueden ver tu nombre, casa, teléfono y tus solicitudes para poder revisarlas. Los demás vecinos solo ven qué horarios están ocupados, no quién los reservó.</p>

        <h2>Cuánto tiempo los guardamos</h2>
        <p>Mientras tengas una cuenta activa. Si pides que se elimine, borramos tu cuenta y tus reservaciones, salvo lo que la administración deba conservar por obligación legal.</p>

        <h2 id="eliminar-datos">Tus derechos y cómo eliminar tus datos</h2>
        <p>
          Puedes pedir en cualquier momento ver, corregir o eliminar tus datos, u oponerte a su uso (derechos ARCO). Escríbenos por WhatsApp
          indicando el correo de tu cuenta; responderemos en un máximo de 20 días hábiles.
        </p>
        {deleteLink ? (
          <a href={deleteLink} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]">
            Pedir la eliminación de mis datos por WhatsApp
          </a>
        ) : (
          <p>Comunícate con la administración del residencial.</p>
        )}
        <p>Si ya no quieres recibir avisos por WhatsApp, respóndenos “BAJA” y dejaremos de enviártelos.</p>

        <h2>Cambios a este aviso</h2>
        <p>Si cambiamos este aviso, publicaremos la nueva versión en esta misma página con su fecha de actualización.</p>
      </article>

      <p className="mt-6 text-center">
        <Link href="/login" className="font-bold text-brand-700 underline-offset-4 hover:underline">Ir a Iniciar sesión</Link>
      </p>
    </main>
  );
}
