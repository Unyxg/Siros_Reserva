import { Palmtree } from "lucide-react";

/** Split-screen layout for login / register with the vector palapa illustration. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen flex-1 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-800 bg-cover bg-bottom lg:block" style={{ backgroundImage: "url(/images/palapa.svg)" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="text-lg font-semibold uppercase tracking-widest text-brand-100">Área común</p>
          <h2 className="mt-2 text-5xl font-extrabold leading-tight">Tu Palapa,<br />a un clic de distancia.</h2>
          <p className="mt-4 max-w-md text-xl text-white/90">
            Revisa qué días están libres, pide tu fecha y recibe la respuesta del comité aquí mismo.
          </p>
        </div>
      </aside>

      <section className="flex flex-col items-center justify-center pb-10 lg:px-10 lg:py-10">
        {/* Phones & tablets: the illustration becomes a banner */}
        <div className="h-40 w-full bg-cover bg-[center_62%] sm:h-52 lg:hidden" style={{ backgroundImage: "url(/images/palapa.svg)" }} aria-hidden />
        <div className="mt-8 w-full max-w-md px-5 sm:px-0 lg:mt-0">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <Palmtree className="h-8 w-8" aria-hidden />
            </span>
            <span className="text-2xl font-extrabold text-stone-900">Reserva la Palapa</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-lg text-stone-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-base">
            <a href="/privacidad" className="text-stone-500 underline-offset-4 hover:underline">Aviso de privacidad</a>
          </p>
        </div>
      </section>
    </main>
  );
}
