import type { MetadataRoute } from "next";

// Makes the site installable as an app ("Agregar a pantalla de inicio").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reserva la Palapa",
    short_name: "Palapa",
    description: "Aparta el área común (Palapa) de tu residencial.",
    lang: "es-MX",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7f4",
    theme_color: "#059669",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: "Reservar", url: "/dashboard", icons: [{ src: "/icon-192.png", sizes: "192x192" }] }],
  };
}
