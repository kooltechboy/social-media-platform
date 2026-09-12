/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@caribbean/design-system',
    '@caribbean/creator',
    '@caribbean/media',
    '@caribbean/jobs',
    '@caribbean/payments',
    '@caribbean/analytics',
  ],
};

export default nextConfig;
