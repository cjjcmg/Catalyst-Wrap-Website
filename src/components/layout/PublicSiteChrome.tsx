"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeadPopup from "@/components/ui/LeadPopup";

/**
 * Wraps the root layout's children with the marketing nav / footer / lead
 * popup — but skips all of that for customer-facing flows where the site
 * chrome would be noise (public quote acceptance, etc.). Anywhere the
 * chrome is skipped, children render edge-to-edge so the destination page
 * can own its own header.
 */
const CHROMELESS_PREFIXES = ["/quotes/"];

export default function PublicSiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const chromeless = CHROMELESS_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (chromeless) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Navbar />
      <div className="pt-24 sm:pt-28">
        <main>{children}</main>
      </div>
      <Footer />
      <LeadPopup />
    </>
  );
}
