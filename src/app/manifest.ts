import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/assetPath";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const startUrl = withBasePath("/") || "/";
  return {
    name: "Pizzaria Artesanal — Forno a Lenha",
    short_name: "Pizzaria.io",
    description: "Pizzas artesanais de fermentação natural preparadas no forno a lenha.",
    start_url: startUrl,
    display: "standalone",
    background_color: "#181514",
    theme_color: "#C84B31",
    orientation: "portrait-primary",
    icons: [
      {
        src: withBasePath("/icon.svg") || "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-192.png") || "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-512.png") || "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
