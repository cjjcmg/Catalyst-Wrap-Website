"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "CRM", href: "/admin/crm", matchPrefix: "/admin/crm" },
  { label: "Quotes", href: "/admin/quotes-docs", matchPrefix: "/admin/quotes-docs" },
  { label: "Invoices", href: "/admin/invoices", matchPrefix: "/admin/invoices" },
  { label: "Products", href: "/admin/products", matchPrefix: "/admin/products" },
  { label: "Reports", href: "/admin/reports/revenue", matchPrefix: "/admin/reports" },
  { label: "Schedule", href: "/admin/schedule", matchPrefix: "/admin/schedule" },
  { label: "Settings", href: "/admin/settings", matchPrefix: "/admin/settings" },
];

const BARE_ROUTES = ["/admin/login", "/admin/reset-password"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const bare = BARE_ROUTES.some((r) => pathname.startsWith(r));

  if (bare) return <>{children}</>;

  return (
    <>
      <div className="sticky top-24 sm:top-28 z-30 border-b border-catalyst-border bg-catalyst-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto py-2" aria-label="Admin sections">
            {NAV_LINKS.map((l) => {
              const active = pathname.startsWith(l.matchPrefix);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-catalyst-red text-white"
                      : "text-catalyst-grey-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </>
  );
}
