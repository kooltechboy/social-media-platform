import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/map',
          '/sounds',
          '/podcasts',
          '/marketplace',
          '/events',
          '/pages',
          '/reels',
          '/terms',
          '/privacy',
          '/login',
          '/signup',
        ],
        disallow: [
          '/api/',
          '/settings',
          '/financial-center',
          '/messages',
          '/notifications',
          '/admin',
          '/moderation',
          '/moderator',
          '/merchant',
          '/creator-studio',
        ],
      },
    ],
    sitemap: 'https://www.tukubi.com/sitemap.xml',
  };
}
