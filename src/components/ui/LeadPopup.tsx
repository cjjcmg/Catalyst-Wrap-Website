"use client";

import { useState, useEffect, useCallback } from "react";
import QuoteForm from "@/components/ui/QuoteForm";

const STORAGE_KEY = "catalyst_popup_dismissed";
const DELAY_MS = 12_000; // 12 seconds
const SCROLL_THRESHOLD = 0.4; // 40% of page

export default function LeadPopup() {
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const show = useCallback(() => {
    // Don't show if already dismissed this session
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY)) return;
    setOpen(true);
    setTriggered(true);
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
  };

  // Trigger 1: 12-second delay
  useEffect(() => {
    if (triggered) return;
    const timer = setTimeout(() => {
      if (!triggered) show();
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [triggered, show]);

  // Trigger 2: 40% scroll depth
  useEffect(() => {
    if (triggered) return;
    const handleScroll = () => {
      const scrollPercent =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent >= SCROLL_THRESHOLD) {
        show();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [triggered, show]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Get a fast quote"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-catalyst-dark p-6 sm:p-8 shadow-2xl animate-fade-in-up">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute right-4 top-4 text-catalyst-grey-500 hover:text-white transition-colors"
          aria-label="Close popup"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-white">
            Get a Fast Quote
          </h2>
          <p className="mt-2 text-sm text-catalyst-grey-400">
            Tell us about your vehicle and we&apos;ll get back to you quickly.
          </p>
        </div>

        <QuoteForm compact onSuccess={close} />
      </div>
    </div>
  );
}
