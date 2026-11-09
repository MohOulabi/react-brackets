'use client';

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { type ReactNode, useState } from 'react';
import {
  Bracket,
  type ClassNames,
  doubleElimination,
  roundRobin,
  singleElimination,
  swiss,
} from 'react-brackets';
import { play, teams } from '@/components/demos/data';
import { cn } from '@/lib/utils';

const phoneStage = play(singleElimination(teams(8)), 0.45);

/** A device frame drawn from the palette, not a stock mock-up. */
export function PhoneShowcase() {
  return (
    <div className="mx-auto w-full max-w-[22rem] rounded-[2.75rem] bg-court-deep p-3 shadow-[0_30px_60px_-30px_rgb(16_33_63/0.55)]">
      <div className="overflow-hidden rounded-[2.1rem] bg-background px-4 pt-10 pb-6">
        <p className="mb-5 font-display text-2xl">Spring Cup</p>
        <Bracket stage={phoneStage} connectorRadius={6} />
      </div>
    </div>
  );
}

const formats = [
  {
    id: 'single',
    label: 'Single elimination',
    note: 'Seeded with automatic byes, and an optional third place match.',
    render: () => <Bracket stage={play(singleElimination(teams(8), { thirdPlace: true }), 0.5)} />,
  },
  {
    id: 'double',
    label: 'Double elimination',
    note: 'Winners and losers brackets, with a grand final that resets when it has to.',
    render: () => <Bracket stage={play(doubleElimination(teams(8)), 0.45)} />,
  },
  {
    id: 'two-sided',
    label: 'Two-sided',
    note: 'Two halves of the draw meeting in the middle, like on a broadcast.',
    render: () => (
      <Bracket
        stage={play(singleElimination(teams(16)), 0.4)}
        layout="mirrored"
        style={{
          ['--rb-match-width' as string]: '8.5rem',
          ['--rb-column-gap' as string]: '1.5rem',
        }}
      />
    ),
  },
  {
    id: 'round-robin',
    label: 'Round robin',
    note: 'Everyone plays everyone, in one or more groups, with standings to match.',
    render: () => <Bracket stage={play(roundRobin(teams(6)), 0.5)} />,
  },
  {
    id: 'swiss',
    label: 'Swiss',
    note: 'Equal records meet each round, and nobody plays the same opponent twice.',
    render: () => <Bracket stage={play(swiss(teams(8)), 0.6)} />,
  },
] as const;

export function FormatShowcase() {
  const [active, setActive] = useState<(typeof formats)[number]['id']>('single');
  const format = formats.find((item) => item.id === active) ?? formats[0];

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Formats"
        className="flex gap-6 overflow-x-auto overflow-y-hidden overscroll-x-contain shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:none]"
      >
        {formats.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === active}
            onClick={() => setActive(item.id)}
            className={cn(
              'shrink-0 border-b-2 border-transparent pb-3 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground',
              item.id === active && 'border-brand text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground">{format.note}</p>
      <div role="tabpanel" className="min-w-0 rounded-2xl bg-card p-5 sm:p-8">
        {format.render()}
      </div>
    </div>
  );
}

const sample = play(singleElimination(teams(4)), 0.34);

const tailwindClasses: ClassNames = {
  content: 'gap-x-10',
  'round-title': 'pb-3 text-sm font-semibold text-muted-foreground',
  cell: 'py-1.5',
  match:
    'w-48 overflow-hidden rounded-lg bg-court text-white data-highlighted:ring-2 data-highlighted:ring-optic',
  participant:
    'flex justify-between px-3 py-2 text-sm not-first:border-t not-first:border-white/15 data-loser:text-white/55 data-winner:font-semibold',
  connector: 'stroke-brand/50 [stroke-width:2]',
};

const styles: { id: string; label: string; code: string; preview: ReactNode }[] = [
  {
    id: 'theme',
    label: 'Theme variables',
    code: `import '@react-brackets/theme/theme.css';

<Bracket stage={stage} className="spring-cup" />

/* styles.css */
.spring-cup {
  --rb-accent: #ea580c;
  --rb-radius: 16px;
  --rb-line-width: 2px;
}`,
    preview: (
      <Bracket
        stage={sample}
        compactBelow={0}
        connectorRadius={12}
        style={{
          ['--rb-accent' as string]: '#ea580c',
          ['--rb-radius' as string]: '16px',
          ['--rb-line-width' as string]: '2px',
          ['--rb-match-width' as string]: '11rem',
        }}
      />
    ),
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    code: `<Bracket
  stage={stage}
  unstyled
  classNames={{
    match: 'w-48 rounded-lg bg-court text-white',
    participant: 'flex justify-between px-3 py-2 data-winner:font-semibold',
    connector: 'stroke-brand/50',
  }}
/>`,
    preview: (
      <Bracket
        stage={sample}
        classNames={tailwindClasses}
        unstyled
        compactBelow={0}
        connectorRadius={8}
      />
    ),
  },
  {
    id: 'card',
    label: 'Your own card',
    code: `<Bracket
  stage={stage}
  renderMatch={(match) => (
    <Bracket.Match className="w-56 rounded-xl border bg-card">
      <Bracket.Participant slot={0}>
        {({ participant, slot }) => <Row team={participant} score={slot.score} />}
      </Bracket.Participant>
      <Bracket.Participant slot={1}>…</Bracket.Participant>
    </Bracket.Match>
  )}
/>`,
    preview: (
      <Bracket
        stage={sample}
        compactBelow={0}
        connectorRadius={10}
        renderMatch={() => (
          <Bracket.Match className="w-56 overflow-hidden rounded-xl border bg-card">
            {([0, 1] as const).map((slot) => (
              <Bracket.Participant
                key={slot}
                slot={slot}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                {({ participant, winner, slot: { score } }) => (
                  <>
                    <span className="grid size-7 place-items-center rounded-full bg-court text-xs font-semibold text-white">
                      {participant?.name.slice(0, 2) ?? '–'}
                    </span>
                    <span className={cn('flex-1 text-sm', winner && 'font-semibold')}>
                      {participant?.name ?? 'To be decided'}
                    </span>
                    <span className="text-sm tabular-nums">{score ?? ''}</span>
                  </>
                )}
              </Bracket.Participant>
            ))}
          </Bracket.Match>
        )}
      />
    ),
  },
];

export function StylingShowcase() {
  const [active, setActive] = useState('theme');
  const style = styles.find((item) => item.id === active) ?? styles[0];
  if (!style) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <div role="tablist" aria-label="Styling approaches" className="flex gap-2">
          {styles.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === active}
              onClick={() => setActive(item.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                item.id === active && 'bg-foreground text-background hover:text-background',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <DynamicCodeBlock lang="tsx" code={style.code} />
      </div>
      <div role="tabpanel" className="flex min-w-0 items-center rounded-2xl bg-card p-5 sm:p-8">
        <div className="w-full min-w-0">{style.preview}</div>
      </div>
    </div>
  );
}
