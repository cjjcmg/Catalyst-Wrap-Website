import { siteConfig } from "@/config/site";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center gradient-hero noise-overlay overflow-hidden"
      aria-label="Hero"
    >
      {/* Background image slot */}
      {/* TODO: Replace with actual hero image or video. For video, add a <video> element here. */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        role="presentation"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-catalyst-black via-catalyst-black/60 to-transparent" />

      <div className="section-container relative z-10 py-32 sm:py-40">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="mb-4 font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red animate-fade-in-up">
            Anaheim&apos;s Premier Auto Customizer
          </p>

          {/* Headline */}
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up animate-delay-100">
            Your Vehicle.{" "}
            <span className="bg-gradient-to-r from-white to-catalyst-grey-300 bg-clip-text text-transparent">
              Elevated.
            </span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-catalyst-grey-400 sm:text-xl animate-fade-in-up animate-delay-200">
            Premium vinyl wraps, paint protection film, and window tint &mdash; precision&#8209;installed for discerning owners across Los&nbsp;Angeles and Orange&nbsp;County.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-fade-in-up animate-delay-300">
            <Button href="/contact" variant="primary" size="lg">
              Get a Quote
            </Button>
            <Button href={siteConfig.phoneHref} variant="secondary" size="lg">
              <PhoneIcon />
              Call {siteConfig.phone}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-catalyst-black to-transparent" />
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
