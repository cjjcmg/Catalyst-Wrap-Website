"use client";

import { useState, type FormEvent } from "react";
import { siteConfig, services } from "@/config/site";
import Button from "@/components/ui/Button";

interface QuoteFormProps {
  /** Display a compact version (popup) vs full (page) */
  compact?: boolean;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  vehicle: string;
  message: string;
  textUpdates: boolean;
}

const initialData: FormData = {
  name: "",
  email: "",
  phone: "",
  service: "",
  vehicle: "",
  message: "",
  textUpdates: false,
};

export default function QuoteForm({ compact = false, onSuccess }: QuoteFormProps) {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setStatus("error");
      setErrorMessage("Please fill in your name, email, and phone number.");
      return;
    }

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Submission failed");

      setStatus("success");
      setFormData(initialData);
      onSuccess?.();
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again or call us directly.");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-4xl mb-2">&#10003;</div>
        <h3 className="font-heading text-xl font-bold text-white">
          Thank You for Submitting
        </h3>
        <p className="text-catalyst-grey-400">
          We will get back to you ASAP. For faster service, call us directly.
        </p>
        <Button href={siteConfig.phoneHref} variant="primary" size="lg">
          Call {siteConfig.phone}
        </Button>
      </div>
    );
  }

  const inputStyles =
    "w-full rounded-lg border border-catalyst-border bg-catalyst-dark px-4 py-3 text-sm text-white placeholder:text-catalyst-grey-600 focus:border-catalyst-red focus:outline-none focus:ring-1 focus:ring-catalyst-red transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={compact ? "space-y-3" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <label htmlFor="quote-name" className="sr-only">Full name</label>
          <input
            id="quote-name"
            name="name"
            type="text"
            placeholder="Full Name *"
            required
            value={formData.name}
            onChange={handleChange}
            className={inputStyles}
          />
        </div>
        <div>
          <label htmlFor="quote-email" className="sr-only">Email</label>
          <input
            id="quote-email"
            name="email"
            type="email"
            placeholder="Email *"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputStyles}
          />
        </div>
        <div>
          <label htmlFor="quote-phone" className="sr-only">Phone</label>
          <input
            id="quote-phone"
            name="phone"
            type="tel"
            placeholder="Phone *"
            required
            value={formData.phone}
            onChange={handleChange}
            className={inputStyles}
          />
        </div>
        <div>
          <label htmlFor="quote-service" className="sr-only">Service needed</label>
          <select
            id="quote-service"
            name="service"
            value={formData.service}
            onChange={handleChange}
            className={inputStyles}
          >
            <option value="">Service Needed</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
            <option value="other">Other / Not Sure</option>
          </select>
        </div>
        <div className={compact ? "" : "sm:col-span-2"}>
          <label htmlFor="quote-vehicle" className="sr-only">Vehicle</label>
          <input
            id="quote-vehicle"
            name="vehicle"
            type="text"
            placeholder="Vehicle (Year, Make, Model)"
            value={formData.vehicle}
            onChange={handleChange}
            className={inputStyles}
          />
        </div>
        <div className={compact ? "" : "sm:col-span-2"}>
          <label htmlFor="quote-message" className="sr-only">Notes</label>
          <textarea
            id="quote-message"
            name="message"
            rows={compact ? 2 : 3}
            placeholder="Notes — tell us about your project (optional)"
            value={formData.message}
            onChange={handleChange}
            className={inputStyles + " resize-none"}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer text-sm text-catalyst-grey-400">
        <input
          type="checkbox"
          name="textUpdates"
          checked={formData.textUpdates}
          onChange={handleChange}
          className="h-4 w-4 rounded border-catalyst-border bg-catalyst-dark text-catalyst-red focus:ring-catalyst-red"
        />
        Text me updates (optional)
      </label>

      {status === "error" && (
        <p className="text-catalyst-red-light text-sm">{errorMessage}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending..." : "Get a Fast Quote"}
      </Button>
    </form>
  );
}
