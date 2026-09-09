import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pizzaria Artesanal — Forno a Lenha",
  description: "Pizzas artesanais de fermentação natural preparadas no forno a lenha.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased selection:bg-pizza-terracotta selection:text-white">
        {children}
      </body>
    </html>
  );
}
