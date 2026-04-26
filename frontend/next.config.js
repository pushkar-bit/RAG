/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Turbopack for faster dev server startup and HMR
  turbopack: {
    // Use a stable cache directory inside the project
    root: process.cwd(),
  },

  // Force Turbopack to transpile lucide-react (ESM-only package)
  transpilePackages: ['lucide-react'],

  // Reduce image optimization overhead in dev
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
