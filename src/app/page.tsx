import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import Services from "@/components/sections/Services";
import QualityMatters from "@/components/sections/QualityMatters";
import Testimonials from "@/components/sections/Testimonials";
import Brands from "@/components/sections/Brands";
import CTABand from "@/components/sections/CTABand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Services />
      <QualityMatters />
      <Testimonials />
      <Brands />
      <CTABand />
    </>
  );
}
