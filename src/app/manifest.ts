import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pizzaria Artesanal — Forno a Lenha",
    short_name: "Pizzaria.io",
    description: "Pizzas artesanais de fermentação natural preparadas no forno a lenha.",
    start_url: "/",
    display: "standalone",
    background_color: "#181514",
    theme_color: "#C84B31",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "192x192 512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
