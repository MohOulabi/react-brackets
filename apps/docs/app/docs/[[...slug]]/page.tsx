import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageActions } from '@/components/docs/page-actions';
import { getMDXComponents } from '@/components/mdx';
import { markdownPath } from '@/lib/llms';
import { site } from '@/lib/site';
import { source } from '@/lib/source';
import { archivedMajor, type Major } from '@/lib/versions';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const archived = archivedMajor(page.url);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
      <PageActions markdown={markdownPath(page.url)} />
      {archived && <OlderVersion url={page.url} {...archived} />}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from the page's own data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: page.data.title,
            description: page.data.description,
            url: `${site.url}${page.url}`,
            about: page.url.startsWith('/docs/native')
              ? '@react-brackets/native'
              : 'react-brackets',
            isPartOf: { '@type': 'WebSite', name: site.name, url: site.url },
            author: { '@type': 'Person', name: site.author.name, url: site.author.url },
          }),
        }}
      />
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  return {
    title: nativeTitle(page.url, page.data.title),
    description: page.data.description,
    alternates: { canonical: page.url, types: { 'text/markdown': markdownPath(page.url) } },
    // Older versions stay readable for anyone still on them, but searches should land on the latest docs.
    robots: archivedMajor(page.url) ? { index: false, follow: true } : undefined,
  };
}

/** Says which version an archived page describes, and links to the same page in the latest docs. */
function OlderVersion({ url, major, latest }: { url: string; major: Major; latest: Major }) {
  const same = `${latest.url}${url.slice(major.url.length)}`;
  const target = source.getPage(
    same
      .replace(/^\/docs\/?/, '')
      .split('/')
      .filter(Boolean),
  )
    ? same
    : latest.url;
  return (
    <div className="not-prose mb-2 rounded-xl border border-fd-primary/30 bg-fd-primary/5 px-4 py-3 text-sm">
      You're reading the docs for {major.label}, kept for apps still on it.{' '}
      <a href={target} className="font-medium text-fd-primary underline underline-offset-4">
        Read this in the latest docs
      </a>
    </div>
  );
}

/** Native pages share names with web ones, like Installation, so their titles say which they are. */
function nativeTitle(url: string, title: string): string {
  if (url === '/docs/native') return 'Tournament brackets for React Native';
  const archived = archivedMajor(url);
  if (archived) return `${title} for React Native ${archived.major.label}`;
  return url.startsWith('/docs/native/') ? `${title} for React Native` : title;
}
