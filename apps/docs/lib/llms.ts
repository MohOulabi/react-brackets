import type { Node } from 'fumadocs-core/page-tree';
import type { InferPageType } from 'fumadocs-core/source';
import { site } from '@/lib/site';
import { source } from '@/lib/source';

type Page = InferPageType<typeof source>;

/** Where a page's plain Markdown copy lives: `/docs/guides/results` is `/md/docs/guides/results.md`. */
export const markdownPath = (url: string): string => `/md${url}.md`;

/** A page as Markdown for language models: its title, where it lives, its summary and its content. */
export async function pageText(page: Page): Promise<string> {
  const content = readable(await page.data.getText('processed'));
  return [
    `# ${page.data.title}`,
    `Source: ${site.url}${page.url}`,
    page.data.description ?? '',
    content,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Drops what only makes sense on the page: live demos, phone frames, recordings, tabs and layout wrappers, and
 * heading anchors. Code blocks are left exactly as they are. A props table generated from the types becomes a
 * pointer to it.
 */
function readable(markdown: string): string {
  const out: string[] = [];
  let code = false;
  let tag = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) code = !code;
    if (code || /^\s*(```|~~~)/.test(line)) {
      out.push(line);
      continue;
    }
    const table = line.match(/^\s*<ApiTable\b[^>]*name="(\w+)"/);
    if (table) {
      out.push(
        `(Every field of \`${table[1]}\`, with its type and default, is in the API reference.)`,
      );
      tag = !line.trimEnd().endsWith('>');
      continue;
    }
    // Code tabs keep their label, so the React and React Native versions can be told apart.
    const tab = line.match(/^\s*<Tab\s+value="([^"]+)"/);
    if (tab) {
      out.push(`${tab[1]}:`);
      continue;
    }
    // A JSX element on its own lines: skip it to the line that closes its tag.
    if (tag || /^\s*<\/?[A-Za-z][\w.]*(\s|>|\/|$)/.test(line)) {
      tag = !line.trimEnd().endsWith('>');
      continue;
    }
    out.push(line.replace(/ \[#[\w-]+\]$/, ''));
  }
  return out.join('\n').replace(/(\n[ \t]*){3,}/g, '\n\n');
}

/** Pages in sidebar order: the React docs first, then React Native. */
export function orderedPages(): Page[] {
  const urls: string[] = [];
  const walk = (nodes: Node[]) => {
    for (const node of nodes) {
      if (node.type === 'page') urls.push(node.url);
      if (node.type === 'folder') {
        if (node.index) urls.push(node.index.url);
        walk(node.children);
      }
    }
  };
  walk(source.getPageTree().children);
  const byUrl = new Map(source.getPages().map((page) => [page.url, page]));
  const ordered = [...new Set(urls)].flatMap((url) => byUrl.get(url) ?? []);
  const native = (page: Page) => page.url.startsWith('/docs/native');
  return [...ordered.filter((page) => !native(page)), ...ordered.filter(native)];
}
