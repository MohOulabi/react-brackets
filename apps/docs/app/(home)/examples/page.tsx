import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  Basic,
  CustomMatch,
  DoubleElimination,
  FullBracket,
  GroupsToPlayoffs,
  LiveScores,
  Loading,
  RoundRobin,
  Rtl,
  Swiss,
  Tailwind,
  Theme,
  TwoSided,
} from '@/components/examples/apps';
import { OnScreen } from '@/components/examples/on-screen';
import { repository } from '@/lib/layout.shared';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Examples',
  description:
    'Small React apps built with react-brackets: every format, the theme, Tailwind, custom match cards, right to left, live scores and loading states, each with its code.',
  alternates: { canonical: '/examples' },
};

interface Example {
  /** The folder under `examples/`, also the anchor on this page. */
  folder: string;
  title: string;
  summary: string;
  /** Source files to show, relative to the example's folder. */
  files: string[];
  demo?: ReactNode;
}

const groups: { title: string; examples: Example[] }[] = [
  {
    title: 'Start',
    examples: [
      {
        folder: 'basic',
        title: 'Basic',
        summary: 'A stage from a list of teams, passed to one component. The whole quick start.',
        files: ['src/app.tsx'],
        demo: <Basic />,
      },
      {
        folder: 'nextjs',
        title: 'Next.js',
        summary:
          'A server component builds the stage with @react-brackets/core, and the bracket hydrates on the client.',
        files: ['app/page.tsx'],
      },
    ],
  },
  {
    title: 'Formats',
    examples: [
      {
        folder: 'double-elimination',
        title: 'Double elimination',
        summary:
          'Winners and losers brackets and a grand final that can reset, in tabs built from Bracket.Root and its parts.',
        files: ['src/app.tsx', 'src/app.module.css'],
        demo: <DoubleElimination />,
      },
      {
        folder: 'two-sided',
        title: 'Two-sided bracket',
        summary:
          'Sixteen teams in two halves that meet in the final. Follow a team to light up its path.',
        files: ['src/app.tsx', 'src/app.module.css'],
        demo: <TwoSided />,
      },
      {
        folder: 'round-robin',
        title: 'Round robin',
        summary:
          'Everyone plays everyone. Play the season a round at a time and watch the table move.',
        files: ['src/app.tsx', 'src/app.module.css', 'src/standings-table.tsx'],
        demo: <RoundRobin />,
      },
      {
        folder: 'swiss',
        title: 'Swiss',
        summary: 'Each round is paired from the standings so far. Pair a round, play it, repeat.',
        files: ['src/app.tsx', 'src/app.module.css', 'src/standings-table.tsx'],
        demo: <Swiss />,
      },
      {
        folder: 'groups-to-playoffs',
        title: 'Groups to playoffs',
        summary: 'Two groups whose top two teams seed a knockout bracket with a third-place match.',
        files: ['src/app.tsx', 'src/app.module.css', 'src/standings-table.tsx'],
        demo: <GroupsToPlayoffs />,
      },
    ],
  },
  {
    title: 'Styling',
    examples: [
      {
        folder: 'theme',
        title: 'Theme and dark mode',
        summary:
          'The optional stylesheet, recoloured with a few CSS variables. Pick an accent, the corners, and light or dark.',
        files: ['src/app.tsx', 'src/app.module.css'],
        demo: <Theme />,
      },
      {
        folder: 'tailwind',
        title: 'Tailwind CSS',
        summary:
          'No stylesheet of ours at all: Tailwind classes on every part, keyed off its state.',
        files: ['src/app.tsx'],
        demo: <Tailwind />,
      },
      {
        folder: 'custom-match',
        title: 'Custom match card',
        summary:
          'Your own card with kickoff times, team badges and a live marker. Pick a match to see its details.',
        files: ['src/app.tsx', 'src/app.module.css'],
        demo: <CustomMatch />,
      },
      {
        folder: 'rtl',
        title: 'Right to left',
        summary:
          'The same cup in Arabic, right to left, or in English. Round names and labels are yours to translate.',
        files: ['src/app.tsx', 'src/app.module.css'],
        demo: <Rtl />,
      },
    ],
  },
  {
    title: 'Screens and data',
    examples: [
      {
        folder: 'full-bracket',
        title: 'Full bracket on every screen',
        summary:
          'Keep the whole tree on a phone: scroll it, fit it to the width, or pan and pinch to zoom.',
        files: ['src/app.tsx', 'src/app.module.css'],
        demo: <FullBracket />,
      },
      {
        folder: 'live-scores',
        title: 'Live scores',
        summary:
          'Results stream in and winners move on as they land. Pause, restart, or click a match to follow it.',
        files: ['src/app.tsx', 'src/app.module.css'],
        demo: (
          <OnScreen minHeight="26rem">
            <LiveScores />
          </OnScreen>
        ),
      },
      {
        folder: 'loading',
        title: 'Loading',
        summary:
          "A skeleton at the bracket's real size while the draw loads, then the bracket in its place.",
        files: ['src/app.tsx', 'src/app.module.css'],
        demo: (
          <OnScreen minHeight="26rem">
            <Loading />
          </OnScreen>
        ),
      },
    ],
  },
];

const count = groups.reduce((total, group) => total + group.examples.length, 0);

export default function ExamplesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-16 pb-24 sm:px-6 md:pt-24">
      <header className="flex max-w-2xl flex-col gap-5">
        <h1 className="font-display text-balance text-[clamp(2.75rem,6vw,4.5rem)]">Examples.</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {count} small apps from the repository, each running here exactly as it does on its own,
          with all of its code. To run them locally, clone the repository and run{' '}
          <code className="text-foreground">bun run examples</code>.
        </p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Examples" className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-6 text-sm">
            {groups.map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <p className="font-semibold">{group.title}</p>
                {group.examples.map((example) => (
                  <a
                    key={example.folder}
                    href={`#${example.folder}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {example.title}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="flex min-w-0 flex-col">
          {groups.map((group) => (
            <section key={group.title} aria-labelledby={`group-${group.title}`}>
              <h2
                id={`group-${group.title}`}
                className="font-display pt-4 pb-2 text-[clamp(1.75rem,3vw,2.25rem)]"
              >
                {group.title}
              </h2>
              {group.examples.map((example) => (
                <ExampleEntry key={example.folder} example={example} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function ExampleEntry({ example }: { example: Example }) {
  const { folder, title, summary, files, demo } = example;
  return (
    <article id={folder} className="flex scroll-mt-24 flex-col gap-4 border-t py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <a
          href={`${repository}/tree/main/examples/${folder}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          examples/{folder}
        </a>
      </div>
      <p className="max-w-2xl leading-relaxed text-muted-foreground">{summary}</p>
      {demo && (
        <div className="overflow-hidden rounded-xl border bg-fd-background p-4 sm:p-6">{demo}</div>
      )}
      <details className="group" open={!demo}>
        <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-full border px-4 text-sm font-medium transition-colors hover:bg-fd-accent [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Show the code</span>
          <span className="hidden group-open:inline">Hide the code</span>
        </summary>
        <Source folder={folder} files={files} />
      </details>
    </article>
  );
}

async function Source({ folder, files }: { folder: string; files: string[] }) {
  const sources = await Promise.all(
    files.map((file) => readFile(path.join(process.cwd(), '../../examples', folder, file), 'utf8')),
  );
  const blocks = files.map((file, index) => (
    <ServerCodeBlock
      key={file}
      code={sources[index] ?? ''}
      lang={file.endsWith('.css') ? 'css' : 'tsx'}
      codeblock={{ className: 'my-0' }}
    />
  ));
  if (files.length === 1) return <div className="mt-4">{blocks}</div>;
  return (
    <Tabs items={files.map((file) => path.basename(file))} className="mt-4">
      {blocks.map((block, index) => (
        <Tab key={files[index]} value={path.basename(files[index] ?? '')}>
          {block}
        </Tab>
      ))}
    </Tabs>
  );
}
