/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@caribbean/design-system',
    '@caribbean/business',
    '@caribbean/advertising',
    '@caribbean/jobs',
    '@caribbean/payments',
  ],
};

export default nextConfig;
