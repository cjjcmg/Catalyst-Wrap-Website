import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import ContactHero from "@/components/contact/ContactHero";
import ContactFormSection from "@/components/contact/ContactFormSection";
import MapEmbed from "@/components/contact/MapEmbed";
import CTABand from "@/components/sections/CTABand";
import { BreadcrumbSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = generatePageMetadata({
  title: "Contact | Free Quote for Wraps, PPF & Tint | Catalyst Motorsport Anaheim",
  description:
    "Get a free quote for vehicle wraps, PPF, tint or off-road builds. Catalyst Motorsport, 1161 N Cosby Way, Unit T, Anaheim, CA. Call (714) 442-1333.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />
      <ContactHero />
      <ContactFormSection />
      <MapEmbed />
      <CTABand />
    </>
  );
}
