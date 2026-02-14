export default function MapEmbed() {
  return (
    <section className="bg-catalyst-black" aria-label="Map">
      <div className="section-container py-12 sm:py-16">
        <h2 className="font-heading text-2xl font-bold text-white text-center mb-8">
          Find Us
        </h2>
        <div className="overflow-hidden rounded-xl border border-catalyst-border">
          {/*
            Google Maps embed — no API key required.
            Uses the embed search mode which is free and doesn't need authentication.
          */}
          <iframe
            title="Catalyst Motorsport location - 1161 N Cosby Way, Anaheim, CA"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3314.5!2d-117.9!3d33.85!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s1161+N+Cosby+Way%2C+Anaheim%2C+CA!5e0!3m2!1sen!2sus!4v1700000000000"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
