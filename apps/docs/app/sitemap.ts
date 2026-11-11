import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { source } from '@/lib/source';
import { archivedMajor } from '@/lib/versions';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = source
    .getPages()
    .filter((page) => !archivedMajor(page.url))
    .map((page) => ({
      url: `${site.url}${page.url}`,
      changeFrequency: 'weekly' as const,
      priority: page.url === '/docs' ? 0.9 : 0.7,
    }));
  return [
    { url: site.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/examples`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/examples/native`, changeFrequency: 'monthly', priority: 0.8 },
    ...docs,
  ];
}
