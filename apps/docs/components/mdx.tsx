import { createFileSystemGeneratorCache, createGenerator } from 'fumadocs-typescript';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import * as demos from '@/components/demos';
import { Phone, Preview } from '@/components/demos/preview';
import { NativeExample } from '@/components/native/example';
import { Recording } from '@/components/native/recording';

const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
});

const sources = {
  core: '../../packages/core/src/index.ts',
  react: '../../packages/react/src/index.ts',
  native: '../../packages/native/src/index.ts',
};

/** A props or fields table generated from the library's own TSDoc, so it never drifts from the code. */
function ApiTable({ from, name }: { from: keyof typeof sources; name: string }) {
  return <AutoTypeTable path={sources[from]} name={name} generator={generator} />;
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    TypeTable,
    ApiTable,
    Preview,
    NativeExample,
    Recording,
    Phone,
    ...demos,
    ...components,
  };
}
