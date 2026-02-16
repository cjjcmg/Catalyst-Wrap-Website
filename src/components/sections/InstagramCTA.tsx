"use client";

import Script from "next/script";
import { siteConfig } from "@/config/site";

export default function InstagramCTA() {
  return (
    <section id="gallery" className="section-padding gradient-section noise-overlay" aria-label="Instagram Feed">
      <div className="section-container relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-catalyst-red mb-3">
            Our Work
          </p>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Follow Along
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-catalyst-grey-400">
            Check out our latest builds, wraps, and transformations on Instagram.
          </p>
        </div>

        {/* Elfsight Instagram Feed */}
        <div className="mx-auto max-w-5xl">
          <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
          <div className="elfsight-app-91914cf2-1b7e-42bb-b5be-03b9eef9d3bf" data-elfsight-app-lazy />
        </div>

        {/* Follow CTA */}
        <div className="mt-10 text-center">
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-white font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/25"
          >
            <InstagramIcon />
            Follow @catalyst_motorsport
          </a>
        </div>
      </div>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
