import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import ContactHero from "@/components/contact/ContactHero";
import ContactFormSection from "@/components/contact/ContactFormSection";
import MapEmbed from "@/components/contact/MapEmbed";
import CTABand from "@/components/sections/CTABand";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get a quote from ${siteConfig.name}. Vinyl wraps, PPF, window tint, and custom builds in Anaheim — serving Los Angeles and Orange County. Call ${siteConfig.phone}.`,
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactFormSection />
      <MapEmbed />
      <CTABand />
    </>
  );
}
