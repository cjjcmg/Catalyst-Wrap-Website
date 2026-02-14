import QuoteForm from "@/components/ui/QuoteForm";

export default function ContactFormSection() {
  return (
    <section className="section-padding bg-catalyst-dark" aria-label="Contact form">
      <div className="section-container">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Request a Quote
            </h2>
            <p className="mt-2 text-catalyst-grey-400">
              Fill out the form below and we&apos;ll get back to you with a quote.
            </p>
          </div>

          <div className="rounded-2xl border border-catalyst-border bg-catalyst-card p-6 sm:p-8">
            <QuoteForm />
          </div>
        </div>
      </div>
    </section>
  );
}
