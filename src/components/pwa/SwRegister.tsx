"use client";

import * as React from "react";
import { withBasePath } from "@/lib/assetPath";

export function SwRegister() {
  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const swUrl = withBasePath("/sw.js") || "/sw.js";
    navigator.serviceWorker.register(swUrl).catch(() => {
      // Falha silenciosa em ambientes sem suporte a Service Worker
    });
  }, []);

  return null;
}
