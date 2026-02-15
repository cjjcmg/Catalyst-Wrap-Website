import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { siteConfig } from "@/config/site";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeadPopup from "@/components/ui/LeadPopup";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Premium Auto Wraps, PPF & Tint in Anaheim`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "vinyl wrap",
    "paint protection film",
    "PPF",
    "window tint",
    "auto customization",
    "car wrap",
    "Anaheim",
    "Orange County",
    "Los Angeles",
    "off-road",
    "luxury vehicles",
    "ceramic tint",
    "vehicle wrap",
    "Catalyst Motorsport",
  ],
  openGraph: {
    title: `${siteConfig.name} — Premium Auto Wraps, PPF & Tint`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg", // TODO: Add OG image (1200x630)
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Premium Auto Wraps, PPF & Tint`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {/* LocalBusiness JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: siteConfig.name,
              description: siteConfig.description,
              url: siteConfig.url,
              telephone: siteConfig.phone,
              address: {
                "@type": "PostalAddress",
                streetAddress: siteConfig.address.street,
                addressLocality: siteConfig.address.city,
                addressRegion: siteConfig.address.state,
                postalCode: siteConfig.address.zip,
                addressCountry: "US",
              },
              areaServed: [
                { "@type": "City", name: "Anaheim" },
                { "@type": "AdministrativeArea", name: "Orange County" },
                { "@type": "AdministrativeArea", name: "Los Angeles County" },
              ],
              priceRange: "$$",
              image: `${siteConfig.url}/images/og-image.jpg`,
            }),
          }}
        />
      </head>
      <body className="font-body antialiased">
        <Navbar />
        {/* Offset for fixed navbar */}
        <div className="pt-24 sm:pt-28">
          <main>{children}</main>
        </div>
        <Footer />
        <LeadPopup />
      </body>
    </html>
  );
}
