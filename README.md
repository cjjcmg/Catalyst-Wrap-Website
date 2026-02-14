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

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS 3.4**
- Fonts: Outfit (headings) + Inter (body) via `next/font`
- SEO: OpenGraph, Twitter Cards, LocalBusiness JSON-LD
- Accessibility: focus states, ARIA labels, keyboard navigation, color contrast
