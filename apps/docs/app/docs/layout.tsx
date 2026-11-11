import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { VersionMenu } from '@/components/version-menu';
import { baseOptions } from '@/lib/layout.shared';
import { docsTree, source } from '@/lib/source';
import { releases } from '@/lib/versions';

const native = '/docs/native';

/** Web and native docs are two sections, switched at the top of the sidebar. */
const tabs = [
  {
    title: 'React',
    description: 'For the web',
    url: '/docs',
    // Every page outside the native section belongs to the web docs.
    urls: new Set(
      source
        .getPages()
        .map((page) => page.url)
        .filter((url) => !url.startsWith(native)),
    ),
  },
  { title: 'React Native', description: 'For iOS and Android', url: native },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={docsTree()}
      sidebar={{
        tabs,
        banner: <VersionMenu react={releases.react} native={releases.native} />,
      }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
