import { docs } from 'collections/server';
import type * as PageTree from 'fumadocs-core/page-tree';
import { loader } from 'fumadocs-core/source';
import { archivedMajor } from './versions';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

/**
 * The sidebar's tree, with older versions' copies moved to its fallback: hidden from the sidebar until one of their
 * pages is open, then shown as their own tree.
 */
export function docsTree(): PageTree.Root {
  const archived: PageTree.Node[] = [];
  const keep = (nodes: PageTree.Node[]): PageTree.Node[] =>
    nodes.flatMap((node): PageTree.Node[] => {
      if (node.type !== 'folder') return [node];
      const first = node.index ?? node.children.find((child) => child.type === 'page');
      if (node.root && first?.type === 'page' && archivedMajor(first.url)) {
        archived.push(node);
        return [];
      }
      return [{ ...node, children: keep(node.children) }];
    });
  const tree = source.getPageTree();
  const children = keep(tree.children);
  // The native docs already live in the fallback, as a section of their own.
  const fallback = keep(tree.fallback?.children ?? []);
  return {
    ...tree,
    children,
    fallback: {
      ...tree.fallback,
      type: 'root',
      name: tree.name,
      children: [...fallback, ...archived],
    },
  };
}
