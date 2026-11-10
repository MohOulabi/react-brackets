import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { ReactNode } from 'react';
import { repository } from '@/lib/layout.shared';
import { Recording } from './recording';

const examples = path.join(process.cwd(), '../../examples/native/src/examples');

/** An example's files: one file, or a folder whose index comes first. */
async function files(slug: string): Promise<string[]> {
  try {
    const inFolder = await readdir(path.join(examples, slug));
    return inFolder
      .filter((file) => /\.tsx?$/.test(file))
      .sort((a, b) => Number(!a.startsWith('index')) - Number(!b.startsWith('index')))
      .map((file) => `${slug}/${file}`);
  } catch {
    return [`${slug}.tsx`];
  }
}

/**
 * One example from the React Native app: its recording beside what it shows, and
 * the whole example file below, read from the repository so it never drifts.
 */
export async function NativeExample({
  slug,
  title,
  children,
}: {
  slug: string;
  title: string;
  children: ReactNode;
}) {
  const names = await files(slug);
  const sources = await Promise.all(
    names.map((name) => readFile(path.join(examples, name), 'utf8')),
  );
  const blocks = names.map((name, index) => (
    <ServerCodeBlock
      key={name}
      code={sources[index] ?? ''}
      lang="tsx"
      codeblock={{ className: 'my-0' }}
    />
  ));

  return (
    <div className="my-8 flex flex-col gap-6">
      <div className="grid items-center gap-8 sm:grid-cols-[auto_minmax(0,1fr)]">
        <Recording slug={slug} label={`${title}, recorded on an iPhone`} />
        <div className="flex flex-col gap-3 text-[15px] leading-relaxed [&_p]:my-0">
          {children}
          <a
            href={`${repository}/tree/main/examples/native/src/examples/${names[0]?.split('/')[0]}`}
            className="text-sm text-fd-muted-foreground underline-offset-4 hover:text-fd-foreground hover:underline"
          >
            examples/native/src/examples/{names.length > 1 ? `${slug}/` : `${slug}.tsx`}
          </a>
        </div>
      </div>
      {blocks.length > 1 ? (
        <Tabs items={names.map((name) => path.basename(name))}>
          {blocks.map((block, index) => (
            <Tab key={names[index]} value={path.basename(names[index] ?? '')}>
              {block}
            </Tab>
          ))}
        </Tabs>
      ) : (
        blocks
      )}
    </div>
  );
}
