import { MessageCircle } from "lucide-react";

/** Opens WhatsApp with a pre-written message (free "click to chat" link). */
export default function WhatsAppButton({ href, label = "Avisar por WhatsApp", compact = false }: { href: string | null; label?: string; compact?: boolean }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn min-h-11 bg-[#25D366] px-4 py-2 text-base text-white shadow-md shadow-green-600/20 hover:bg-[#1ebe5b] ${compact ? "" : ""}`}
      title={label}
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      <span className={compact ? "sr-only sm:not-sr-only" : ""}>{label}</span>
    </a>
  );
}
