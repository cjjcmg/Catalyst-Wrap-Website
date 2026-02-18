import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { seoConfig } from "@/lib/seo";
import { siteConfig, services, brands, testimonials } from "@/config/site";
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
  metadataBase: new URL(seoConfig.domain),
  title: {
    default: seoConfig.defaultTitle,
    template: seoConfig.titleTemplate,
  },
  description: seoConfig.defaultDescription,
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
    "clear bra",
    "ceramic window tint",
    "off road builds",
    "lift kit",
    "chrome delete",
  ],
  alternates: {
    canonical: seoConfig.domain,
  },
  openGraph: {
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    url: seoConfig.domain,
    siteName: seoConfig.siteName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: seoConfig.ogImage,
        width: seoConfig.ogImageWidth,
        height: seoConfig.ogImageHeight,
        alt: seoConfig.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
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
        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "AutoRepair"],
              name: seoConfig.siteName,
              description: seoConfig.defaultDescription,
              url: seoConfig.domain,
              telephone: seoConfig.phone,
              logo: `${seoConfig.domain}/images/CMW-logo.png`,
              image: `${seoConfig.domain}/images/og-image.jpg`,
              address: {
                "@type": "PostalAddress",
                streetAddress: seoConfig.address.street,
                addressLocality: seoConfig.address.city,
                addressRegion: seoConfig.address.state,
                postalCode: seoConfig.address.zip,
                addressCountry: seoConfig.address.country,
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: seoConfig.geo.latitude,
                longitude: seoConfig.geo.longitude,
              },
              areaServed: seoConfig.serviceAreas.map((area) => ({
                "@type": area.type,
                name: area.name,
              })),
              openingHoursSpecification: seoConfig.openingHours.map((h) => {
                const [days, hours] = h.split(" ");
                const [open, close] = hours.split("-");
                return {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: days,
                  opens: open,
                  closes: close,
                };
              }),
              priceRange: seoConfig.priceRange,
              sameAs: seoConfig.socialProfiles,
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Auto Customization Services",
                itemListElement: services.map((service) => ({
                  "@type": "OfferCatalog",
                  name: service.title,
                  description: service.description,
                })),
              },
              brand: brands.map((b) => ({
                "@type": "Brand",
                name: b.name,
                ...(b.url ? { url: b.url } : {}),
              })),
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5.0",
                bestRating: "5",
                worstRating: "1",
                reviewCount: String(testimonials.length),
              },
              review: testimonials.map((t) => ({
                "@type": "Review",
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: "5",
                  bestRating: "5",
                },
                author: {
                  "@type": "Person",
                  name: t.name,
                },
                reviewBody: t.text,
              })),
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
