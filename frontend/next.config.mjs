import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.VERCEL ? '.next' : '.next.nosync',
  transpilePackages: ['lucide-react'],

  // Fix Turbopack workspace root detection when multiple lockfiles exist
  turbopack: {
    root: __dirname,
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },

  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
