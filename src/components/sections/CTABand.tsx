import { siteConfig } from "@/config/site";
import Button from "@/components/ui/Button";
import QuoteButton from "@/components/ui/QuoteButton";

export default function CTABand() {
  return (
    <section className="relative overflow-hidden noise-overlay" aria-label="Call to action">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-catalyst-red-dark via-catalyst-red to-catalyst-red-dark opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

      <div className="section-container relative z-10 py-16 sm:py-20 text-center">
        <h2 className="font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
          Ready to Transform Your Ride?
        </h2>
        <p className="mt-4 mx-auto max-w-xl text-lg text-white/80">
          Get in touch for a free quote, or call now to schedule your consultation.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <QuoteButton variant="secondary" size="lg" className="bg-white/15 border-white/25 hover:bg-white/25">
            Get a Quote
          </QuoteButton>
          <Button href={siteConfig.phoneHref} variant="secondary" size="lg" className="bg-white/15 border-white/25 hover:bg-white/25">
            <PhoneIcon />
            Call Now
          </Button>
        </div>
      </div>
    </section>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
