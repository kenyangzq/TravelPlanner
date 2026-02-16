const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for production to avoid Azure SWA warmup timeout
  // Dev mode uses hybrid rendering for dynamic routes support
  ...(process.env.NODE_ENV === 'production' ? {
    output: 'export',
    trailingSlash: true,
  } : {}),
  reactStrictMode: true,
  images: { unoptimized: true },
};

module.exports = withPWA(nextConfig);
