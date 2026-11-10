import Link from 'next/link';
import type { ReactNode } from 'react';
import { CourtHero } from '@/components/home/court-hero';
import { FormatShowcase, PhoneShowcase, StylingShowcase } from '@/components/home/showcases';
import { Recording } from '@/components/native/recording';
import { Playground } from '@/components/playground';
import { repository } from '@/lib/layout.shared';
import { site } from '@/lib/site';
import { cn } from '@/lib/utils';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: site.name,
  description: site.description,
  url: site.url,
  codeRepository: site.repository,
  programmingLanguage: ['TypeScript', 'React', 'React Native'],
  license: 'https://opensource.org/licenses/MIT',
  author: { '@type': 'Person', name: site.author.name, url: site.author.url },
  sameAs: [site.npm],
};

export default function HomePage() {
  return (
    <main className="flex flex-col">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from constants
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CourtHero />

      <section className="mx-auto w-full max-w-6xl px-4 pt-44 pb-20 sm:px-6 md:pt-52 md:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-24">
          <div className="flex max-w-xl flex-col gap-6">
            <Heading>Still a bracket on a phone.</Heading>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Narrow screens get one round at a time, drawn as a bracket: the round you're on stacks
              neatly, the next one waits at the edge with its lines, and a swipe glides every match
              into place.
            </p>
            <dl className="mt-2 flex flex-col text-[15px] leading-relaxed">
              {points.map(([title, body]) => (
                <div
                  key={title}
                  className="grid gap-1 border-t py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
                >
                  <dt className="font-semibold">{title}</dt>
                  <dd className="text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <PhoneShowcase />
        </div>
      </section>

      <Section band="bg-card/60 border-y">
        <div className="flex flex-col gap-12 md:gap-16">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
            <Heading>In React Native, too.</Heading>
            <div className="flex max-w-xl flex-col gap-5">
              <p className="text-lg leading-relaxed text-muted-foreground">
                <code className="text-foreground">@react-brackets/native</code> draws the same
                stages in React Native and Expo. Every swipe, zoom and line moves on the UI thread,
                cards open and the bracket makes room, and it styles with StyleSheet, Uniwind or
                Unistyles.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/docs/native"
                  className="inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  React Native docs
                </Link>
                <Link
                  href="/examples/native"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  See the examples
                </Link>
              </div>
            </div>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory items-start gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:justify-center sm:overflow-visible sm:px-0 md:gap-10">
            {nativeScreens.map((screen, index) => (
              <div
                key={screen.slug}
                className={cn('w-60 shrink-0 snap-center sm:w-[272px]', index === 1 && 'sm:mt-12')}
              >
                <Recording slug={screen.slug} label={screen.label} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col gap-10 md:gap-14">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
            <Heading>Every format, one component.</Heading>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Build a stage with one function call, report results as they come in, and pass it to{' '}
              <code className="text-foreground">{'<Bracket>'}</code>. Winners move on, byes resolve,
              and overturned results clear what came after them.
            </p>
          </div>
          <FormatShowcase />
        </div>
      </Section>

      <Section className="pt-0 md:pt-0">
        <div className="flex flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <Heading>Styled with what you already use.</Heading>
            <p className="text-lg leading-relaxed text-muted-foreground">
              The same bracket, before and after. Every element carries a{' '}
              <code className="text-foreground">data-part</code> and its state, like{' '}
              <code className="text-foreground">data-winner</code> or{' '}
              <code className="text-foreground">data-status="live"</code>, so the theme, Tailwind or
              your own card can take it anywhere. Drag the divider.
            </p>
          </div>
          <StylingShowcase />
        </div>
      </Section>

      <Section id="playground" band="bg-card/60 border-t">
        <div className="flex flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <Heading>Every prop, live.</Heading>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Change the format, the number of teams and how much has been played. Switch to the
              phone preview to try the swipeable bracket. The code updates as you go.
            </p>
          </div>
          <Playground />
        </div>
      </Section>

      <section className="bg-court-deep text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-20 sm:px-6 md:py-24">
          <p className="font-display max-w-4xl text-balance text-[clamp(2.25rem,5vw,4rem)]">
            Free and open source. React 18 and 19 with no other dependencies, about 15 kB gzipped,
            and React Native with Expo.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/docs"
              className="inline-flex h-11 items-center rounded-full bg-optic px-6 font-semibold text-[#10213f] transition-colors hover:bg-[#e4fb7a]"
            >
              Read the docs
            </Link>
            <a href={repository} className="font-medium underline-offset-4 hover:underline">
              Star it on GitHub
            </a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <span>MIT licensed. Built by Mohammed AlOulabi.</span>
        <a href="https://oulabi.dev" className="hover:text-foreground">
          oulabi.dev
        </a>
      </footer>
    </main>
  );
}

const nativeScreens = [
  { slug: 'quick-start', label: 'A bracket swiped round by round on an iPhone' },
  { slug: 'esports', label: 'An esports bracket with rosters that open, played map by map' },
  { slug: 'right-to-left', label: 'An Arabic cup read and swiped from the right' },
];

const points = [
  [
    'Sized by its container',
    'Not the window, so it adapts inside a sidebar, a modal or a dashboard card.',
  ],
  [
    'Or keep the whole tree',
    'Let it scroll, scale it to fit, or let people pan and pinch to zoom.',
  ],
  [
    'Built in, not bolted on',
    'The swipe, zoom and animation are part of the library, with no gesture dependencies.',
  ],
] as const;

function Section({
  children,
  className,
  band,
  id,
}: {
  children: ReactNode;
  className?: string;
  band?: string;
  id?: string;
}) {
  return (
    <section id={id} className={band}>
      <div className={cn('mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28', className)}>
        {children}
      </div>
    </section>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-balance text-[clamp(2.25rem,4.5vw,3.5rem)]">{children}</h2>
  );
}
