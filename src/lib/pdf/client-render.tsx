"use client";

import type { QuotePDFData } from "./QuotePDF";

/**
 * Render a QuotePDF to a Blob in the browser. Called imperatively from the
 * Send / Resend flows so the same PDF bytes the staff previews in the UI are
 * exactly what gets emailed to the customer. Uses @react-pdf/renderer's
 * top-level pdf() API, which is client-side-only.
 */
export async function renderQuotePDFBlob(data: QuotePDFData): Promise<Blob> {
  const [{ pdf }, { QuotePDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./QuotePDF"),
  ]);
  return await pdf(<QuotePDF data={data} />).toBlob();
}
