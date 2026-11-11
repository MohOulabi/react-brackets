import { orderedPages, pageText } from '@/lib/llms';

export const dynamic = 'force-static';

/** Every docs page as Markdown in one file, for language models that read a whole library at once. */
export async function GET(): Promise<Response> {
  const pages = await Promise.all(orderedPages().map(pageText));
  return new Response(pages.join('\n\n---\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
