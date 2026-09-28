import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Reserva la Palapa", template: "%s · Reserva la Palapa" },
  description: "Solicita el uso del área común (Palapa) de tu residencial de forma fácil y rápida.",
};

export const viewport: Viewport = { themeColor: "#059669" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
