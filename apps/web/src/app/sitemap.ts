import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.tukubi.com';
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/explore`, lastModified, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/map`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/sounds`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/podcasts`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/marketplace`, lastModified, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/events`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/communities`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/pages`, lastModified, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/reels`, lastModified, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${baseUrl}/signup`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return routes;
}
