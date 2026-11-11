import { notFound } from 'next/navigation';
import { pageText } from '@/lib/llms';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

interface Context {
  params: Promise<{ slug: string[] }>;
}

/** A docs page as plain Markdown, at `/md/docs/…/page.md`. */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  const { slug } = await params;
  const path = slug.join('/').replace(/\.md$/, '');
  const page = source.getPage(
    path
      .replace(/^docs\/?/, '')
      .split('/')
      .filter(Boolean),
  );
  if (!page) notFound();
  return new Response(await pageText(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => {
    const parts = page.url.split('/').filter(Boolean);
    const last = parts.pop() ?? 'docs';
    return { slug: [...parts, `${last}.md`] };
  });
}
