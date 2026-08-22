/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@caribbean/ui",
    "@caribbean/design-system",
    "@caribbean/spotpay",
    "@caribbean/ai",
    "@caribbean/database",
    "@caribbean/analytics",
    "@caribbean/trust-safety",
  ],
  reactStrictMode: true,
};

module.exports = nextConfig;
