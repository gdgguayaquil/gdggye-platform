import type { MetadataRoute } from "next";

// Next 14+ generates /manifest.webmanifest from this file at build time.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GDG Guayaquil",
    short_name: "GDG Gye",
    description:
      "Comunidad de desarrolladores en Guayaquil, Ecuador. Eventos, talleres y meetups.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4285f4",
    lang: "es",
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
