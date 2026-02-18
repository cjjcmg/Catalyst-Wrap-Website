# Catalyst Motorsport — Website

Premium auto customization website built with Next.js 14, TypeScript, and Tailwind CSS.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (fonts, metadata, JSON-LD)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles + Tailwind
│   ├── contact/
│   │   └── page.tsx        # Contact page
│   └── api/
│       └── quote/
│           └── route.ts    # Form submission API
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx      # Sticky nav with CTAs
│   │   └── Footer.tsx      # Full contact info footer
│   ├── sections/           # Landing page sections
│   │   ├── Hero.tsx
│   │   ├── TrustStrip.tsx
│   │   ├── Services.tsx
│   │   ├── QualityMatters.tsx
│   │   ├── Brands.tsx
│   │   ├── Gallery.tsx
│   │   ├── Testimonials.tsx
│   │   └── CTABand.tsx
│   ├── contact/            # Contact page components
│   │   ├── ContactHero.tsx
│   │   ├── ContactFormSection.tsx
│   │   └── MapEmbed.tsx
│   └── ui/                 # Reusable UI
│       ├── Button.tsx
│       ├── QuoteForm.tsx
│       └── LeadPopup.tsx
├── config/
│   └── site.ts             # ⬅ EDIT THIS: business info, services, brands
└── lib/
    └── utils.ts
```

## How to Customize

### Business Info (phone, address, socials)

Edit **`src/config/site.ts`** — the `siteConfig` object at the top of the file. All pages and components read from this file.

### Services

Edit the `services` array in **`src/config/site.ts`**. Each service has a title, description, benefits list, and image path.

### Brands / Partners

Add or remove brands in the `brands` array in **`src/config/site.ts`**:

```ts
{
  name: "New Brand",
  logo: "/images/brands/new-brand.png",  // optional
  url: "https://www.newbrand.com",        // optional
},
```

If no logo image is provided, a styled text wordmark is shown automatically.

### Testimonials

Replace the sample testimonials in `testimonials` array in **`src/config/site.ts`** with real customer reviews.

### Gallery

1. Replace placeholder images in `public/images/gallery/` with real photos
2. Update the `gallery` array in **`src/config/site.ts`** with correct alt text and categories

### Images

Replace these placeholder files in `public/images/`:

| File | What to put there |
|------|-------------------|
| `CMW-logo.jpg` | Your logo (already in place) |
| `hero-bg.jpg` | Hero background (1920x1080+ recommended) |
| `og-image.jpg` | Social sharing image (1200x630) |
| `service-vinyl-wrap.jpg` | Vinyl wrap service photo |
| `service-ppf.jpg` | PPF service photo |
| `service-window-tint.jpg` | Window tint service photo |
| `service-customization.jpg` | Customization service photo |
| `quality-detail.jpg` | Install detail/quality shot |
| `gallery/gallery-01.jpg` ... `gallery-12.jpg` | Gallery photos |
| `brands/vorsteiner.png` | Vorsteiner logo/wordmark |
| `brands/dirt-king.png` | Dirt King logo/wordmark |

## Form Submissions

Form submissions are currently saved to `data/submissions.json` (local file). To connect to email or a CRM:

1. Open **`src/app/api/quote/route.ts`**
2. Add your integration in the `POST` handler where the TODO comments are
3. Popular options:
   - **Email**: Resend, SendGrid, Nodemailer
   - **CRM**: HubSpot, GoHighLevel, Salesforce
   - **Notifications**: Slack or Discord webhook
   - **Database**: Supabase, PlanetScale, MongoDB

## Lead Popup

The lead capture popup triggers on:
- 12-second delay after page load
- 40% scroll depth

It only shows once per session (uses `sessionStorage`). To adjust timing, edit the constants at the top of `src/components/ui/LeadPopup.tsx`.

## Deployment

```bash
npm run build    # Production build
npm run start    # Start production server
```

Works with Vercel, Netlify, or any Node.js host. For Vercel:

```bash
npx vercel
```

## SEO Architecture

### Content Files

All SEO page content is managed through typed data files in `src/content/`:

| File | What it controls |
|------|-----------------|
| `services.ts` | Service page content, FAQs, related vehicles |
| `locations.ts` | Location page content, FAQs, local context |
| `vehicles.ts` | Vehicle page content, packages, FAQs |

### How to Update FAQs and Page Content

1. Open the relevant content file in `src/content/`
2. Find the page by its `slug` property
3. Edit the `faqs` array, intro text, or any other field
4. Rebuild: `npm run build`

### How to Add a New Service

1. Add an entry to the `servicePages` array in `src/content/services.ts`
2. The route is auto-generated from the `slug` field (e.g., `slug: "ceramic-coating"` creates `/services/ceramic-coating`)
3. Update footer links in `src/components/layout/Footer.tsx` if needed
4. Rebuild to generate the new static page

### How to Add a New Location

1. Add an entry to the `locationPages` array in `src/content/locations.ts`
2. Include `popularServices` and `popularVehicles` for internal linking
3. Update footer links in `src/components/layout/Footer.tsx`
4. Rebuild to generate the new static page

### How to Add a New Vehicle

1. Add an entry to the `vehiclePages` array in `src/content/vehicles.ts`
2. Include `packages` (3 tiers) and `relatedServices` for internal linking
3. Update footer links in `src/components/layout/Footer.tsx`
4. Rebuild to generate the new static page

### SEO Configuration

Global SEO settings (site name, address, phone, geo, hours, social profiles) are in `src/lib/seo.ts`. This is the single source of truth for all metadata and schema markup.

### How to Verify Sitemap and Robots in Production

1. Visit `https://yourdomain.com/sitemap.xml` to verify all routes are listed
2. Visit `https://yourdomain.com/robots.txt` to verify crawl rules
3. Submit the sitemap URL in Google Search Console
4. Use Google's Rich Results Test to validate structured data
5. Visit `/analytics` (internal, not indexed) for a full route audit

### Schema Markup

- **LocalBusiness + AutoRepair**: Home page and location pages
- **Service**: Service pages
- **FAQPage**: Every page with an FAQ section
- **BreadcrumbList**: All non-home pages

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS 3.4**
- Fonts: Outfit (headings) + Inter (body) via `next/font`
- SEO: OpenGraph, Twitter Cards, canonical URLs, LocalBusiness/Service/FAQPage/BreadcrumbList JSON-LD
- Accessibility: focus states, ARIA labels, keyboard navigation, color contrast
- Dynamic sitemap and robots.txt generation
- Content-driven architecture with typed data files
