import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    // Search engines and AI assistants are all welcome: the docs are written to be quoted and learned from.
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-SearchBot',
          'Claude-User',
          'PerplexityBot',
          'Google-Extended',
          'Applebot-Extended',
          'CCBot',
        ],
        allow: '/',
        disallow: '/api/',
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
