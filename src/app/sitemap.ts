import type { MetadataRoute } from 'next';
import { tools } from '@/lib/tools';
export default function sitemap(): MetadataRoute.Sitemap { const base = 'https://toolforge-ashen.vercel.app'; return [{ url: base, changeFrequency: 'weekly', priority: 1 }, ...tools.map((tool) => ({ url: `${base}/tools/${tool.slug}`, changeFrequency: 'monthly' as const, priority: tool.popular ? 0.8 : 0.6 }))]; }
