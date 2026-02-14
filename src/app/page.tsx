import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import Services from "@/components/sections/Services";
import QualityMatters from "@/components/sections/QualityMatters";
import Brands from "@/components/sections/Brands";
import Gallery from "@/components/sections/Gallery";
import Testimonials from "@/components/sections/Testimonials";
import CTABand from "@/components/sections/CTABand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Services />
      <QualityMatters />
      <Brands />
      <Gallery />
      <Testimonials />
      <CTABand />
    </>
  );
}
