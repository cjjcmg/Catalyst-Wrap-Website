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

        {/* Brand row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-20">
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
  const img = brand.logo ? (
    <div className={brand.logoClassName}>
      <img
        src={brand.logo}
        alt={brand.name}
        className="w-full h-auto object-contain opacity-60 transition-opacity duration-300 group-hover:opacity-100"
      />
    </div>
  ) : (
    <span className="font-heading text-xl font-bold tracking-wider text-catalyst-grey-500 transition-colors duration-300 group-hover:text-white uppercase sm:text-2xl">
      {brand.name}
    </span>
  );

  const className = "group flex items-center justify-center";

  if (brand.url) {
    return (
      <a href={brand.url} target="_blank" rel="noopener noreferrer" className={className} aria-label={brand.name}>
        {img}
      </a>
    );
  }

  return <div className={className}>{img}</div>;
}
