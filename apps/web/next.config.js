/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@caribbean/ui", "@caribbean/design-system", "@caribbean/spotpay", "@caribbean/ai"],
  reactStrictMode: true,
};

module.exports = nextConfig;
