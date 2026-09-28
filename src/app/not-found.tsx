import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <p className="text-6xl">🌴</p>
      <h1 className="mt-4 text-3xl font-extrabold text-stone-900">No encontramos esta página</h1>
      <Link href="/" className="btn-primary mt-6">Volver al inicio</Link>
    </main>
  );
}
