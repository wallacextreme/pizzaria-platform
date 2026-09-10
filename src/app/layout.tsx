import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pizzaria.io";

export const viewport: Viewport = {
  themeColor: "#C84B31",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pizzaria Artesanal — Forno a Lenha | Forno & Massa",
    template: "%s | Forno & Massa Pizzaria Artesanal",
  },
  description:
    "Pizzas artesanais com fermentação natural lenta (48h), farinha italiana e assadas no autêntico forno a lenha. Delivery rápido e retirada no balcão.",
  keywords: [
    "pizzaria artesanal",
    "pizza forno a lenha",
    "fermentação natural",
    "delivery de pizza",
    "pizza napolitana",
    "forno & massa",
  ],
  authors: [{ name: "Forno & Massa Pizzaria" }],
  creator: "Forno & Massa",
  publisher: "Forno & Massa Pizzaria",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Forno & Massa — Pizzaria Artesanal",
    title: "Pizzaria Artesanal — Forno a Lenha | Forno & Massa",
    description:
      "Pizzas artesanais de fermentação natural de 48h, ingredientes selecionados e forno a lenha. Peça online com facilidade.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Forno & Massa Pizzaria Artesanal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pizzaria Artesanal — Forno a Lenha | Forno & Massa",
    description:
      "Pizzas artesanais de fermentação natural de 48h, ingredientes selecionados e forno a lenha.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Schema.org Restaurant & Menu Structured Data
const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": `${siteUrl}/#restaurant`,
      "name": "Forno & Massa Pizzaria Artesanal",
      "description":
        "Pizzas artesanais de fermentação natural lenta (48h), ingredientes selecionados e assadas no autêntico forno a lenha.",
      "image": `${siteUrl}/icon.svg`,
      "servesCuisine": ["Italian", "Pizza"],
      "priceRange": "$$",
      "telephone": "+55-11-99999-0000",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Rua das Pizzas, 1000",
        "addressLocality": "São Paulo",
        "addressRegion": "SP",
        "postalCode": "01310-000",
        "addressCountry": "BR",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -23.55052,
        "longitude": -46.633308,
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Sunday"],
          "opens": "18:00",
          "closes": "23:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Friday", "Saturday"],
          "opens": "18:00",
          "closes": "23:59",
        },
      ],
      "hasMenu": {
        "@type": "Menu",
        "@id": `${siteUrl}/#menu`,
        "name": "Cardápio Artesanal",
        "hasMenuSection": [
          {
            "@type": "MenuSection",
            "name": "Pizzas Tradicionais & Especiais",
            "hasMenuItem": [
              {
                "@type": "MenuItem",
                "name": "Margherita Verace",
                "description":
                  "Molho de tomate San Marzano DOP, mozzarella di bufala fresca, folhas de manjericão e fio de azeite extravirgem.",
                "offers": {
                  "@type": "Offer",
                  "price": "49.90",
                  "priceCurrency": "BRL",
                },
              },
              {
                "@type": "MenuItem",
                "name": "Calabresa Artesanal",
                "description":
                  "Molho artesanal, calabresa defumada fatiada ultrafina, cebola roxa marinada e azeitonas pretas.",
                "offers": {
                  "@type": "Offer",
                  "price": "54.90",
                  "priceCurrency": "BRL",
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </head>
      <body className="antialiased selection:bg-pizza-terracotta selection:text-white bg-pizza-charcoal text-pizza-cream">
        {children}
      </body>
    </html>
  );
}
