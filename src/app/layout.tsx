import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Providers from "@/components/Providers";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Reserva la Palapa", template: "%s · Reserva la Palapa" },
  description: "Solicita el uso del área común (Palapa) de tu residencial de forma fácil y rápida.",
  appleWebApp: { capable: true, title: "Palapa", statusBarStyle: "default" },
  // Meta (Facebook) domain verification for the business portfolio
  other: { "facebook-domain-verification": "v2fjtzpq5nw589a5c6wdf8kffmqcyo" },
};

export const viewport: Viewport = { themeColor: "#059669" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  );
}
