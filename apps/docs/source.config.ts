import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

// Each page also keeps its Markdown, for llms.txt and the plain `.md` copy of every page.
export const docs = defineDocs({
  dir: 'content/docs',
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

export default defineConfig();
