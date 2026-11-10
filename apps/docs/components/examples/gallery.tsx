import Link from 'next/link';
import type { ReactNode } from 'react';
import { ExamplesNav } from '@/components/examples/nav';
import { cn } from '@/lib/utils';

export type Platform = 'react' | 'native';

export interface GalleryExample {
  /** The anchor on the page. */
  id: string;
  title: string;
  summary: string;
  /** Where the example lives in the repository, shown and linked. */
  path: string;
  /** The example running, or recorded on a phone. Without one, the code is open from the start. */
  preview?: ReactNode;
  code: ReactNode;
}

export interface GalleryGroup {
  title: string;
  examples: GalleryExample[];
}

const platforms: { id: Platform; title: string; href: string }[] = [
  { id: 'react', title: 'React', href: '/examples' },
  { id: 'native', title: 'React Native', href: '/examples/native' },
];

/** The examples of one platform, under a switch to the other, laid out the same way for both. */
export function Gallery({
  platform,
  intro,
  groups,
  repository,
}: {
  platform: Platform;
  intro: ReactNode;
  groups: GalleryGroup[];
  repository: string;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-16 pb-24 sm:px-6 md:pt-24">
      <header className="flex max-w-2xl flex-col gap-5">
        <h1 className="font-display text-balance text-[clamp(2.75rem,6vw,4.5rem)]">Examples.</h1>
        <nav
          aria-label="Platform"
          className="inline-flex h-10 self-start rounded-full border bg-fd-secondary/50 p-1 text-sm font-medium"
        >
          {platforms.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-current={item.id === platform ? 'page' : undefined}
              className={cn(
                'inline-flex items-center rounded-full px-4 text-muted-foreground transition-colors hover:text-foreground',
                'aria-[current]:bg-background aria-[current]:text-foreground aria-[current]:shadow-xs',
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <p className="text-lg leading-relaxed text-muted-foreground">{intro}</p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-16">
        <ExamplesNav
          groups={groups.map((group) => ({
            title: group.title,
            links: group.examples.map(({ id, title }) => ({ id, title })),
          }))}
        />

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
                <Entry key={example.id} example={example} repository={repository} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Entry({ example, repository }: { example: GalleryExample; repository: string }) {
  const { id, title, summary, path, preview, code } = example;
  return (
    <article id={id} className="flex scroll-mt-24 flex-col gap-4 border-t py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <a
          href={`${repository}/tree/main/${path}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {path}
        </a>
      </div>
      <p className="max-w-2xl leading-relaxed text-muted-foreground">{summary}</p>
      {preview && (
        <div className="example-stage overflow-hidden rounded-2xl border p-4 sm:p-7">{preview}</div>
      )}
      <details className="group" open={!preview}>
        <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-full border px-4 text-sm font-medium transition-colors hover:bg-fd-accent [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Show the code</span>
          <span className="hidden group-open:inline">Hide the code</span>
        </summary>
        {code}
      </details>
    </article>
  );
}
