import Link from 'next/link';
import type { ReactNode } from 'react';
import { CourtHero } from '@/components/home/court-hero';
import { FormatShowcase, PhoneShowcase, StylingShowcase } from '@/components/home/showcases';
import { Playground } from '@/components/playground';
import { repository } from '@/lib/layout.shared';

export default function HomePage() {
  return (
    <main className="flex flex-col">
      <CourtHero />

      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="flex max-w-xl flex-col gap-6">
            <Heading>Still a bracket on a phone.</Heading>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Narrow screens get one round at a time, drawn as a bracket: the round you're on stacks
              neatly, the next one waits at the edge with its lines, and a swipe glides every match
              into place.
            </p>
            <ul className="flex flex-col gap-4 text-[15px] leading-relaxed">
              <li>
                <strong className="font-semibold">Measured from its container,</strong> not the
                window, so it adapts inside a sidebar, a modal or a dashboard card.
              </li>
              <li>
                <strong className="font-semibold">Prefer the whole tree?</strong> Let it scroll,
                scale it to fit, or let people pan and pinch to zoom.
              </li>
              <li>
                <strong className="font-semibold">Built in, not bolted on.</strong> The swipe, zoom
                and animation are part of the library, with no gesture dependencies.
              </li>
            </ul>
          </div>
          <PhoneShowcase />
        </div>
      </Section>

      <Section className="bg-card/60">
        <div className="flex flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <Heading>Every format, one component.</Heading>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Build a stage with one function call, report results as they come in, and pass it to{' '}
              <code className="text-foreground">{'<Bracket>'}</code>. Winners move on, byes resolve,
              and overturned results clear what came after them.
            </p>
          </div>
          <FormatShowcase />
        </div>
      </Section>

      <Section>
        <div className="flex flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <Heading>Styled with what you already use.</Heading>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Every element carries a <code className="text-foreground">data-part</code> and its
              state, like <code className="text-foreground">data-winner</code> or{' '}
              <code className="text-foreground">data-status="live"</code>. Use the optional theme,
              Tailwind classes, or your own match card. Connector lines follow whatever you draw.
            </p>
          </div>
          <StylingShowcase />
        </div>
      </Section>

      <Section id="playground" className="bg-card/60">
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
            Free and open source. React 18 and 19, no other dependencies, about 6 kB.
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

function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">{children}</div>
    </section>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-balance text-[clamp(2.25rem,4.5vw,3.5rem)]">{children}</h2>
  );
}
