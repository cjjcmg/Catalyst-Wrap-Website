import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { seoConfig } from "@/lib/seo";
import PublicSiteChrome from "@/components/layout/PublicSiteChrome";
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
        {/* Geo meta tags for local SEO */}
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Anaheim" />
        <meta name="geo.position" content="33.8525;-117.8868" />
        <meta name="ICBM" content="33.8525, -117.8868" />

        {/* Global Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "AutomotiveBusiness",
                "@id": "https://www.catalystmotorsport.com/#business",
                "name": "Catalyst Motorsport",
                "alternateName": "Catalyst Motorsport Wraps",
                "url": "https://www.catalystmotorsport.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.catalystmotorsport.com/images/CM_logo_wh.webp",
                  "width": 400,
                  "height": 100
                },
                "image": "https://www.catalystmotorsport.com/images/quality.webp",
                "description": "Premium vinyl wraps, paint protection film (PPF), ceramic window tint, and off-road customization in Anaheim, CA. Certified installers serving Orange County and Los Angeles with precision auto protection and vehicle transformation services.",
                "telephone": "+1-714-442-1333",
                "email": "team@catalystmotorsport.com",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1161 N Cosby Way, Unit T",
                  "addressLocality": "Anaheim",
                  "addressRegion": "CA",
                  "postalCode": "92806",
                  "addressCountry": "US"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": 33.8525,
                  "longitude": -117.8868
                },
                "areaServed": [
                  {"@type": "City", "name": "Anaheim"},
                  {"@type": "City", "name": "Irvine"},
                  {"@type": "City", "name": "Orange"},
                  {"@type": "City", "name": "Santa Ana"},
                  {"@type": "City", "name": "Fullerton"},
                  {"@type": "City", "name": "Huntington Beach"},
                  {"@type": "City", "name": "Costa Mesa"},
                  {"@type": "City", "name": "Newport Beach"},
                  {"@type": "City", "name": "Tustin"},
                  {"@type": "City", "name": "Yorba Linda"},
                  {"@type": "City", "name": "Brea"},
                  {"@type": "City", "name": "Placentia"},
                  {"@type": "City", "name": "Long Beach"},
                  {"@type": "City", "name": "Los Angeles"},
                  {"@type": "City", "name": "Riverside"}
                ],
                "openingHoursSpecification": [
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
                    "opens": "09:00",
                    "closes": "18:00"
                  },
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": "Saturday",
                    "opens": "09:00",
                    "closes": "15:00"
                  }
                ],
                "priceRange": "$$$",
                "paymentAccepted": "Cash, Credit Card, Debit Card",
                "currenciesAccepted": "USD",
                "sameAs": [
                  "https://www.instagram.com/catalyst_motorsport/",
                  "https://www.facebook.com/100085310825383/",
                  "https://www.yelp.com/biz/catalyst-motorsport-wraps-anaheim"
                ],
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Vehicle Protection & Customization Services",
                  "itemListElement": [
                    {
                      "@type": "OfferCatalog",
                      "name": "Vinyl Wraps",
                      "itemListElement": [
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Full Body Vinyl Wrap","url":"https://www.catalystmotorsport.com/services/vinyl-wrap"}},
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Partial Vinyl Wrap"}},
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Chrome Delete Package"}},
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Commercial Fleet Wraps"}}
                      ]
                    },
                    {
                      "@type": "OfferCatalog",
                      "name": "Paint Protection Film",
                      "itemListElement": [
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Full Body PPF","url":"https://www.catalystmotorsport.com/services/paint-protection-film"}},
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Partial Front PPF"}},
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Full Front PPF"}},
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Track Pack PPF"}}
                      ]
                    },
                    {
                      "@type": "OfferCatalog",
                      "name": "Window Tint",
                      "itemListElement": [
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Ceramic Window Tint","url":"https://www.catalystmotorsport.com/services/window-tint"}},
                        {"@type":"Offer","itemOffered":{"@type":"Service","name":"Carbon Window Tint"}}
                      ]
                    },
                    {"@type":"Offer","itemOffered":{"@type":"Service","name":"Off-Road Builds","url":"https://www.catalystmotorsport.com/services/off-road-builds"}}
                  ]
                },
                "knowsAbout": [
                  "Vinyl Vehicle Wraps","Paint Protection Film","PPF Installation","Clear Bra",
                  "Ceramic Window Tint","Carbon Window Tint","Chrome Delete","Off-Road Vehicle Builds",
                  "Lift Kit Installation","Vehicle Customization","XPEL PPF","3M Vinyl Wrap",
                  "Avery Dennison Wrap","Tesla Vehicle Protection","Luxury Vehicle Wraps"
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Catalyst Motorsport",
                "url": "https://www.catalystmotorsport.com",
                "publisher": {"@id": "https://www.catalystmotorsport.com/#business"}
              }
            ]),
          }}
        />
      </head>
      <body className="font-body antialiased">
        <PublicSiteChrome>{children}</PublicSiteChrome>
      </body>
    </html>
  );
}
