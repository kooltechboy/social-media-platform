import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TUKUBI',
    short_name: 'TUKUBI',
    description: 'The Caribbean Connected.',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#060A13',
    theme_color: '#0a0612',
    categories: ['social', 'entertainment', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'Explore & Diaspora',
        short_name: 'Explore',
        description: 'Explore Caribbean culture, music, and diaspora communities',
        url: '/explore',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Caribbean Sounds',
        short_name: 'Sounds',
        description: 'Listen to trending Caribbean music and sounds',
        url: '/sounds',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Live Streams',
        short_name: 'Live',
        description: 'Watch live broadcasts and carnival streams',
        url: '/live',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Messages',
        short_name: 'Messages',
        description: 'Direct Caribbean conversations',
        url: '/messages',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
