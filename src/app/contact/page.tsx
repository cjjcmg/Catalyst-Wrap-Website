import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import ContactHero from "@/components/contact/ContactHero";
import ContactFormSection from "@/components/contact/ContactFormSection";
import MapEmbed from "@/components/contact/MapEmbed";
import CTABand from "@/components/sections/CTABand";
import { BreadcrumbSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = generatePageMetadata({
  title: "Contact Us",
  description:
    "Get a quote from Catalyst Motorsport. Vinyl wraps, PPF, window tint, and custom builds in Anaheim, serving Los Angeles and Orange County. Call (714) 442-1333.",
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
