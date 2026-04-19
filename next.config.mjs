/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Leave @react-pdf/renderer external on the server — bundling it through
  // webpack mangles its react-reconciler dependency and triggers "Cannot
  // read properties of undefined (reading 'S')" at renderToBuffer(). The
  // client bundle handles it fine via dynamic import / BlobProvider, so we
  // only need the server exclusion.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
