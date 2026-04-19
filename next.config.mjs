/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // @react-pdf/renderer ships as an ESM package whose subpath imports
  // confuse webpack unless transpiled. We only render PDFs in the browser
  // now (client-render.tsx / BlobProvider), so transpilePackages alone is
  // enough — no serverExternalPackages needed.
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;
