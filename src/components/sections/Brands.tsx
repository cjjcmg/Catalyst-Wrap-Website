import Image from "next/image";
import { brands } from "@/config/site";

export default function Brands() {
  return (
    <section className="section-padding gradient-section noise-overlay" aria-label="Featured brands and partners">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red mb-3">
            Products We Install
          </p>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Featured Brands &amp; Partners
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-catalyst-grey-400">
            We source and install products from industry-leading manufacturers to ensure the best results for your vehicle.
          </p>
        </div>

        {/* Brand grid */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {brands.map((brand) => (
            <BrandCard key={brand.name} brand={brand} />
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-10 text-center text-xs text-catalyst-grey-600 max-w-2xl mx-auto">
          Catalyst Motorsport is an independent installer and is not affiliated with or endorsed by these manufacturers.
        </p>
      </div>
    </section>
  );
}

function BrandCard({ brand }: { brand: (typeof brands)[number] }) {
  const content = brand.logo ? (
    <Image
      src={brand.logo}
      alt={brand.name}
      width={160}
      height={60}
      className="h-12 w-auto object-contain opacity-70 transition-opacity duration-300 group-hover:opacity-100 sm:h-14"
    />
  ) : (
    /* Text-based wordmark fallback */
    <span className="font-heading text-2xl font-bold tracking-wider text-catalyst-grey-500 transition-colors duration-300 group-hover:text-white uppercase sm:text-3xl">
      {brand.name}
    </span>
  );

  if (brand.url) {
    return (
      <a
        href={brand.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-24 items-center justify-center rounded-xl border border-catalyst-border px-8 transition-all duration-300 hover:border-catalyst-grey-700 hover:bg-catalyst-card sm:h-28 sm:px-12"
        aria-label={brand.name}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="group flex h-24 items-center justify-center rounded-xl border border-catalyst-border px-8 sm:h-28 sm:px-12">
      {content}
    </div>
  );
}
