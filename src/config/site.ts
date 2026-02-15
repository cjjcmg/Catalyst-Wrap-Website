/* ──────────────────────────────────────────────────────────
   Site Configuration
   Edit this file to update business info, services, brands,
   testimonials, and gallery items across the entire site.
   ────────────────────────────────────────────────────────── */

export const siteConfig = {
  name: "Catalyst Motorsport",
  tagline: "PPF — Wraps — Tint",
  description:
    "Premier auto customization in Anaheim, CA. Vinyl wraps, paint protection film (PPF), window tint, and off-road and luxury vehicle customization — serving Los Angeles and Orange County.",
  url: "https://catalystmotorsport.com", // TODO: Update with actual domain

  phone: "(714) 442-1333",
  phoneHref: "tel:+17144421333",

  address: {
    street: "1161 N Cosby Way",
    city: "Anaheim",
    state: "CA",
    zip: "", // TODO: Add zip code
    full: "1161 N Cosby Way, Anaheim, CA",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=1161+N+Cosby+Way+Anaheim+CA",
  },

  serviceArea: "Los Angeles & Orange County",

  social: {
    // TODO: Replace # with real social URLs
    instagram: "#",
    facebook: "#",
    tiktok: "#",
    yelp: "#",
  },
} as const;

/* ──────────────────────────────────────────────────────────
   Services
   ────────────────────────────────────────────────────────── */

export interface Service {
  slug: string;
  title: string;
  headline: string;
  description: string;
  benefits: string[];
  image: string; // path in /public
}

export const services: Service[] = [
  {
    slug: "vinyl-wraps",
    title: "Vinyl Wraps",
    headline: "Complete Transformation. Zero Commitment.",
    description:
      "Change your vehicle's entire look — or protect the factory finish — with a precision-installed vinyl wrap. Matte, gloss, satin, color-shift, carbon fiber, and custom prints available.",
    benefits: [
      "Full color changes without permanent paint",
      "Protects original paint and preserves resale value",
      "Reversible — remove cleanly when you're ready",
      "Commercial and fleet branding options",
      "Thousands of colors, finishes, and textures",
    ],
    image: "/images/green_G_wrap.webp",
  },
  {
    slug: "ppf",
    title: "Paint Protection Film",
    headline: "Invisible Armor for Your Paint.",
    description:
      "Shield your vehicle from rock chips, road debris, scratches, and environmental damage with optically clear paint protection film. Self-healing technology keeps your finish pristine.",
    benefits: [
      "Guards against rock chips and road debris",
      "Self-healing surface reduces minor scratches",
      "UV-stable — won't yellow or peel over time",
      "Preserves factory paint for years",
      "Virtually invisible once installed",
    ],
    image: "/images/blue_bmw850.webp",
  },
  {
    slug: "window-tint",
    title: "Window Tint",
    headline: "Cool. Private. Protected.",
    description:
      "Professional ceramic and carbon window tint that cuts heat, blocks harmful UV rays, and adds clean, head-turning privacy — without compromising visibility.",
    benefits: [
      "Rejects up to 99% of UV rays",
      "Significant interior heat reduction",
      "Enhanced privacy and security",
      "Reduces glare for a more comfortable drive",
      "Protects interior surfaces from fading",
    ],
    image: "/images/grey_raptor.webp",
  },
  {
    slug: "customization",
    title: "Off-Road & Luxury Customization",
    headline: "Built for How You Drive.",
    description:
      "From trail-ready off-road builds to luxury vehicle upgrades — suspension, lighting, accessories, and performance modifications tailored to your vision.",
    benefits: [
      "Lift kits and suspension for off-road capability",
      "LED and auxiliary lighting upgrades",
      "Wheel and tire packages",
      "Interior and exterior accessories",
      "Luxury and performance enhancements",
    ],
    image: "/images/green_tacoma.webp",
  },
];

/* ──────────────────────────────────────────────────────────
   Brands / Partners
   Add new brands here — they automatically appear on the site.
   ────────────────────────────────────────────────────────── */

export interface Brand {
  name: string;
  logo?: string; // optional path in /public — if omitted, a text wordmark is used
  url?: string; // optional link to the brand
}

export const brands: Brand[] = [
  {
    name: "Vorsteiner",
    logo: "/images/brands/vorsteiner_.webp",
    url: "https://www.vorsteiner.com",
  },
  {
    name: "Dirt King",
    logo: "/images/brands/dirt-king.png",
    url: "https://www.dirtkingfab.com",
  },
  // To add a new brand, copy and paste the template below:
  // {
  //   name: "Brand Name",
  //   logo: "/images/brands/brand-name.png",
  //   url: "https://www.brandwebsite.com",
  // },
];

/* ──────────────────────────────────────────────────────────
   Testimonials
   These are sample placeholders — replace with real customer
   reviews once available. Do NOT present as real people.
   ────────────────────────────────────────────────────────── */

export interface Testimonial {
  name: string;
  vehicle: string;
  text: string;
  service: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Sample Customer A",
    vehicle: "2024 Toyota 4Runner",
    text: "The full-body PPF install was flawless. No visible seams, no lifted edges — just clean, invisible protection. These guys know what they're doing.",
    service: "PPF",
  },
  {
    name: "Sample Customer B",
    vehicle: "2023 BMW M4",
    text: "Went with a satin black wrap and the results are unreal. Every panel is perfect. The attention to detail here is on another level.",
    service: "Vinyl Wrap",
  },
  {
    name: "Sample Customer C",
    vehicle: "2024 Ford Bronco",
    text: "Got the full off-road package — lift, tint, and PPF on the front end. Truck looks incredible and it's ready for anything now.",
    service: "Customization",
  },
  {
    name: "Sample Customer D",
    vehicle: "2023 Porsche 911",
    text: "Ceramic tint on the entire car. The heat difference is night and day, and the install is absolutely flawless. No bubbles, no imperfections.",
    service: "Window Tint",
  },
  {
    name: "Sample Customer E",
    vehicle: "2024 Mercedes G-Wagon",
    text: "Full PPF plus a color-change wrap on the accents. The craftsmanship is outstanding — worth every penny for the peace of mind alone.",
    service: "PPF",
  },
  {
    name: "Sample Customer F",
    vehicle: "2023 Jeep Wrangler",
    text: "They did the tint, a matte military green wrap, and installed my Dirt King kit. One-stop shop with zero compromises on quality.",
    service: "Vinyl Wrap",
  },
];

/* ──────────────────────────────────────────────────────────
   Gallery
   Replace placeholder images in /public/images/gallery/
   ────────────────────────────────────────────────────────── */

export type GalleryCategory = "all" | "wrap" | "ppf" | "tint" | "offroad";

export interface GalleryItem {
  src: string;
  alt: string;
  category: GalleryCategory;
}

export const gallery: GalleryItem[] = [
  { src: "/images/gallery/gallery-01.webp", alt: "Matte black full-body vinyl wrap on sports car", category: "wrap" },
  { src: "/images/gallery/gallery-02.webp", alt: "Full front PPF installation on luxury sedan", category: "ppf" },
  { src: "/images/gallery/gallery-03.webp", alt: "Ceramic window tint on SUV", category: "tint" },
  { src: "/images/gallery/gallery-04.webp", alt: "Off-road truck with lift kit and accessories", category: "offroad" },
  { src: "/images/gallery/gallery-05.webp", alt: "Satin wrap on BMW M4", category: "wrap" },
  { src: "/images/gallery/gallery-06.webp", alt: "Paint protection film detail on hood", category: "ppf" },
  { src: "/images/gallery/gallery-07.webp", alt: "Window tint install on Porsche", category: "tint" },
  { src: "/images/gallery/gallery-08.webp", alt: "Custom off-road Bronco build", category: "offroad" },
  { src: "/images/gallery/gallery-09.webp", alt: "Color-shift vinyl wrap on luxury vehicle", category: "wrap" },
  { src: "/images/gallery/gallery-10.webp", alt: "Full-body PPF on Mercedes", category: "ppf" },
  { src: "/images/gallery/gallery-11.webp", alt: "Tinted windows on muscle car", category: "tint" },
  { src: "/images/gallery/gallery-12.webp", alt: "Custom Jeep Wrangler off-road build", category: "offroad" },
];

/* ──────────────────────────────────────────────────────────
   Trust indicators (shown in the Trust Strip)
   ────────────────────────────────────────────────────────── */

export const trustIndicators = [
  {
    icon: "map-pin",
    title: "Serving",
    description: "Los Angeles & Orange County",
  },
  {
    icon: "shield-check",
    title: "Warranty-Backed",
    description: "Workmanship you can count on",
  },
  {
    icon: "truck",
    title: "Luxury + Off-Road",
    description: "Specialists in both worlds",
  },
  {
    icon: "ruler",
    title: "Precision Standards",
    description: "Meticulous install quality",
  },
] as const;
