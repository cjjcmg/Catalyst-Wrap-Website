"use client";

import { BlobProvider } from "@react-pdf/renderer";
import { QuotePDF, type QuotePDFData } from "@/lib/pdf/QuotePDF";

/**
 * Renders the quote PDF in-browser via BlobProvider and displays it in an
 * iframe. BlobProvider is more robust under Next 15 / webpack bundling than
 * the react-pdf <PDFViewer> component (which has been crashing with minified
 * runtime errors like "su is not a function" in some app-router setups).
 */
export function QuotePreview({ data }: { data: QuotePDFData }) {
  return (
    <BlobProvider document={<QuotePDF data={data} />}>
      {({ url, loading, error }) => {
        if (error) {
          return (
            <div className="p-6 text-sm text-red-400">
              PDF preview failed to render: {error.message}
            </div>
          );
        }
        if (loading || !url) {
          return <div className="p-6 text-sm text-catalyst-grey-500">Rendering PDF…</div>;
        }
        return (
          <iframe
            src={url}
            title="Quote preview"
            className="w-full h-full border-0"
          />
        );
      }}
    </BlobProvider>
  );
}
