import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import Services from "@/components/sections/Services";
import QualityMatters from "@/components/sections/QualityMatters";
import Brands from "@/components/sections/Brands";
// import Gallery from "@/components/sections/Gallery"; // Hidden for now — will re-enable with real gallery content
import InstagramCTA from "@/components/sections/InstagramCTA";
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
      {/* <Gallery /> */}
      <InstagramCTA />
      <Testimonials />
      <CTABand />
    </>
  );
}
