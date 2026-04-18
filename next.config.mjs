/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // @react-pdf/renderer ships as an ESM package whose subpath imports
  // confuse webpack unless listed here. transpilePackages handles both
  // server and client bundles.
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;
