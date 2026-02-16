import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Gallery", href: "/#gallery" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const serviceLinks = [
  { label: "Vinyl Wraps", href: "/#services" },
  { label: "Paint Protection Film", href: "/#services" },
  { label: "Window Tint", href: "/#services" },
  { label: "Off-Road & Luxury", href: "/#services" },
];

export default function Footer() {
  return (
    <footer className="border-t border-catalyst-border bg-catalyst-black" role="contentinfo">
      <div className="section-container py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Image
              src="/images/CM_logo_wh.webp"
              alt={siteConfig.name}
              width={180}
              height={48}
              className="h-12 w-auto"
            />
            <p className="text-sm text-catalyst-grey-500 leading-relaxed">
              Premier auto customization in Anaheim, California — serving Los Angeles and Orange County.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-catalyst-grey-300 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-catalyst-grey-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-catalyst-grey-300 mb-4">
              Services
            </h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-catalyst-grey-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-catalyst-grey-300 mb-4">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={siteConfig.phoneHref}
                  className="flex items-center gap-2 text-catalyst-grey-400 hover:text-white transition-colors"
                >
                  <PhoneIcon />
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-catalyst-grey-400 hover:text-white transition-colors"
                >
                  <MapPinIcon />
                  <span>{siteConfig.address.full}</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-catalyst-grey-400">
                <GlobeIcon />
                <span>Serving {siteConfig.serviceArea}</span>
              </li>
            </ul>

            {/* Social icons */}
            <div className="mt-4 flex gap-3">
              <SocialLink href={siteConfig.social.instagram} label="Instagram">
                <InstagramIcon />
              </SocialLink>
              {siteConfig.social.facebook !== "#" || true ? (
                <SocialLink href={siteConfig.social.facebook} label="Facebook">
                  <FacebookIcon />
                </SocialLink>
              ) : null}
              {siteConfig.social.tiktok !== "#" || true ? (
                <SocialLink href={siteConfig.social.tiktok} label="TikTok">
                  <TikTokIcon />
                </SocialLink>
              ) : null}
              {siteConfig.social.yelp !== "#" || true ? (
                <SocialLink href={siteConfig.social.yelp} label="Yelp">
                  <YelpIcon />
                </SocialLink>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-catalyst-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-catalyst-grey-600">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>Anaheim, CA &middot; {siteConfig.serviceArea}</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Icon helpers ─────────────────────────────────────── */

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-catalyst-border text-catalyst-grey-500 hover:border-catalyst-grey-600 hover:text-white transition-colors"
    >
      {children}
    </a>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.38-6.2V9.06a8.16 8.16 0 0 0 4.84 1.58v-3.4a4.85 4.85 0 0 1-1-.55z" />
    </svg>
  );
}

function YelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.14 2C6.52 2 2 6.52 2 12.14c0 2.94 1.26 5.59 3.26 7.44l2.44-3.18c-.5-.92-.78-1.96-.78-3.06 0-3.46 2.81-6.27 6.27-6.27.56 0 1.1.07 1.62.21l1.1-3.76A10.08 10.08 0 0 0 12.14 2zm5.42 5.03l-2.72 2.72a3.14 3.14 0 0 1 .51 1.73 3.15 3.15 0 0 1-3.14 3.14 3.14 3.14 0 0 1-1.73-.51l-2.72 2.72A6.24 6.24 0 0 0 12.14 18.4a6.27 6.27 0 0 0 6.27-6.27c0-2.01-.95-3.8-2.42-4.95l-.43-.15z" />
    </svg>
  );
}
