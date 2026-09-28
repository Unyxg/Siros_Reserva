"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Download, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "palapa-install-dismissed";

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

// iPhone has no install prompt, so we show instructions instead.
const noopSubscribe = () => () => {};
const iosHintSnapshot = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !isInstalled() && !wasDismissed();

/** Registers the service worker and offers "Instalar" (Android/desktop) or instructions (iPhone). */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [closed, setClosed] = useState(false);
  const ios = useSyncExternalStore(noopSubscribe, iosHintSnapshot, () => false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (!wasDismissed() && !isInstalled()) setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setClosed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  if (closed || (!deferred && !ios)) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-3xl bg-stone-900 p-4 text-white shadow-2xl sm:bottom-5">
      <Image src="/icon-192.png" alt="" width={48} height={48} className="shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1 text-base">
        <p className="font-bold">Instala la app en tu celular</p>
        {ios ? (
          <p className="text-stone-300">
            Toca <Share className="inline h-4 w-4" aria-label="Compartir" /> y luego “Agregar a inicio”.
          </p>
        ) : (
          <p className="text-stone-300">Ábrela directo desde tu pantalla de inicio.</p>
        )}
      </div>
      {deferred && (
        <button
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            dismiss();
          }}
          className="btn min-h-11 bg-brand-500 px-4 py-2 text-base text-white"
        >
          <Download className="h-5 w-5" aria-hidden /> Instalar
        </button>
      )}
      <button onClick={dismiss} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-white/10" aria-label="Cerrar">
        <X className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
