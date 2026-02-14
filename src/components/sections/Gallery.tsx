"use client";

import { useState } from "react";
import Image from "next/image";
import { gallery, type GalleryCategory } from "@/config/site";
import Button from "@/components/ui/Button";

const filters: { label: string; value: GalleryCategory }[] = [
  { label: "All", value: "all" },
  { label: "Wraps", value: "wrap" },
  { label: "PPF", value: "ppf" },
  { label: "Tint", value: "tint" },
  { label: "Off-Road", value: "offroad" },
];

export default function Gallery() {
  const [active, setActive] = useState<GalleryCategory>("all");

  const filtered = active === "all" ? gallery : gallery.filter((item) => item.category === active);

  return (
    <section id="gallery" className="section-padding gradient-section noise-overlay" aria-label="Gallery">
      <div className="section-container relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red mb-3">
            Our Work
          </p>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            See the Results
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-catalyst-grey-400">
            Browse recent projects across wraps, PPF, tint, and off-road builds.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-10" role="tablist" aria-label="Filter gallery">
          {filters.map((filter) => (
            <button
              key={filter.value}
              role="tab"
              aria-selected={active === filter.value}
              onClick={() => setActive(filter.value)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                active === filter.value
                  ? "bg-catalyst-red text-white shadow-lg shadow-catalyst-red/20"
                  : "bg-white/5 text-catalyst-grey-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {filtered.map((item, i) => (
            <div
              key={item.src}
              className="group relative overflow-hidden rounded-xl bg-catalyst-card aspect-[4/3]"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading={i < 4 ? "eager" : "lazy"}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <p className="text-xs text-white font-medium line-clamp-2">
                  {item.alt}
                </p>
              </div>
              {/* Placeholder fallback (when no real image) */}
              <div className="absolute inset-0 flex items-center justify-center text-catalyst-grey-700 text-xs font-medium tracking-wider uppercase -z-10">
                {item.category}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Button href="/contact" variant="secondary" size="lg">
            See Our Work — Get a Quote
          </Button>
        </div>
      </div>
    </section>
  );
}
