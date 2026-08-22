/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@caribbean/trust-safety",
    "@caribbean/database",
    "@caribbean/design-system",
  ],
  reactStrictMode: true,
};

module.exports = nextConfig;
