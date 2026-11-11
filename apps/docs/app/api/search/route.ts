import { flexsearchFromSource } from 'fumadocs-core/search/flexsearch';
import { source } from '@/lib/source';
import { archivedMajor } from '@/lib/versions';

export const revalidate = false;
// Older versions' copies stay out of search, so a search lands on the latest docs.
export const { staticGET: GET } = flexsearchFromSource({
  ...source,
  getPages: (language) => source.getPages(language).filter((page) => !archivedMajor(page.url)),
});
