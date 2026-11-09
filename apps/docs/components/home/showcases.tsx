'use client';

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Bracket,
  type BracketProps,
  type ClassNames,
  doubleElimination,
  type Match,
  participantMap,
  reportResult,
  roundRobin,
  type Stage,
  singleElimination,
  standings,
  swiss,
} from 'react-brackets';
import { play, teams } from '@/components/demos/data';
import { LiveDot, TeamChip, teamColour } from '@/components/home/court';
import { cn } from '@/lib/utils';

export { PhoneShowcase } from '@/components/home/phone';

/** A match card for the draw sheet: solid chalk on the court, the winner's score set in a court-blue tab. */
function SheetCard({ match }: { match: Match }) {
  const live = match.status === 'live';
  return (
    <Bracket.Match
      className={({ highlighted }) =>
        cn(
          'relative w-[var(--card-width,13.5rem)] overflow-hidden rounded-lg bg-white [--chip-empty:rgb(16_33_63/0.08)] dark:[--chip-empty:rgb(255_255_255/0.1)] text-[#10213f] shadow-[0_1px_0_rgb(16_33_63/0.08),0_14px_28px_-16px_rgb(5_12_30/0.7)] ring-1 ring-transparent transition-shadow dark:bg-[#172b57] dark:text-white',
          highlighted && 'ring-2 ring-optic',
          live && !highlighted && 'ring-white/70',
        )
      }
    >
      {live && (
        <span className="absolute top-1.5 right-11 flex">
          <LiveDot className="size-1.5 [&_span]:bg-court dark:[&_span]:bg-white" />
        </span>
      )}
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant
          key={slot}
          slot={slot}
          className="flex h-9 items-center gap-2.5 py-0 ps-2.5 pe-0 text-[13px] not-first:border-t not-first:border-[#10213f]/8 data-loser:text-[#10213f]/45 data-empty:text-[#10213f]/45 dark:not-first:border-white/8 dark:data-loser:text-white/45 dark:data-empty:text-white/45"
        >
          {({ participant, winner, slot: { score } }) => (
            <>
              <TeamChip id={participant?.id} name={participant?.name} />
              <span className={cn('flex-1 truncate', winner && 'font-semibold')}>
                {participant?.name ?? 'To be decided'}
              </span>
              <span
                className={cn(
                  'grid h-full w-9 place-items-center tabular-nums',
                  winner && 'bg-court font-semibold text-white dark:bg-optic dark:text-[#10213f]',
                )}
              >
                {score ?? ''}
              </span>
            </>
          )}
        </Bracket.Participant>
      ))}
    </Bracket.Match>
  );
}

const sheetClasses: ClassNames = {
  'round-title': 'pb-3 text-[13px] font-medium text-white/65',
  'group-title': 'mb-4 font-display text-xl text-white',
  connector: 'stroke-white/40 data-highlighted:stroke-optic',
  pagination: '[&_button]:text-white/70',
};

function Sheet(props: Omit<BracketProps, 'renderMatch'>) {
  return (
    <Bracket
      mode="fit"
      connectorRadius={10}
      classNames={sheetClasses}
      renderMatch={(match) => <SheetCard match={match} />}
      {...props}
      className={cn('court-bracket', props.className as string)}
    />
  );
}

function Standings({ stage, limit = 8 }: { stage: Stage; limit?: number }) {
  const names = participantMap(stage);
  return (
    <table className="w-full max-w-md text-[13px] tabular-nums">
      <thead className="text-white/55">
        <tr className="[&>th]:pb-2 [&>th]:text-end [&>th]:font-medium">
          <th className="!text-start">Team</th>
          <th>P</th>
          <th>W</th>
          <th>L</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {standings(stage)
          .slice(0, limit)
          .map((row, index) => {
            const name = names.get(row.participantId)?.name;
            return (
              <tr
                key={row.participantId}
                className="border-t border-white/10 [&>td]:py-1.5 [&>td]:text-end"
              >
                <td className="!text-start">
                  <span className="flex items-center gap-2.5">
                    <span className="w-3 text-white/45">{index + 1}</span>
                    <TeamChip id={row.participantId} name={name} className="size-4 text-[9px]" />
                    {name}
                  </span>
                </td>
                <td>{row.played}</td>
                <td>{row.wins}</td>
                <td>{row.losses}</td>
                <td className="font-semibold">{row.points}</td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}

const roundRobinStage = play(roundRobin(teams(6)), 0.6);
const swissStage = play(swiss(teams(8)), 1);

const formats = [
  {
    id: 'single',
    label: 'Single elimination',
    call: 'singleElimination(teams, { thirdPlace: true })',
    note: 'Seeded with automatic byes, and an optional third place match.',
    render: () => <Sheet stage={play(singleElimination(teams(8), { thirdPlace: true }), 0.55)} />,
  },
  {
    id: 'double',
    label: 'Double elimination',
    call: 'doubleElimination(teams)',
    note: 'Winners and losers brackets, with a grand final that resets when it has to.',
    render: () => (
      <Sheet
        stage={play(doubleElimination(teams(8)), 0.5)}
        style={{
          ['--card-width' as string]: '11.5rem',
          ['--rb-column-gap' as string]: '2rem',
        }}
      />
    ),
  },
  {
    id: 'two-sided',
    label: 'Two-sided',
    call: '<Bracket layout="mirrored" />',
    note: 'Two halves of the draw meeting in the middle, like on a broadcast.',
    render: () => (
      <Sheet
        stage={play(singleElimination(teams(8)), 0.55)}
        layout="mirrored"
        style={{
          ['--card-width' as string]: '9.5rem',
          ['--rb-column-gap' as string]: '1.25rem',
        }}
      />
    ),
  },
  {
    id: 'round-robin',
    label: 'Round robin',
    call: 'roundRobin(teams)',
    note: 'Everyone plays everyone, in one or more groups, with standings to match.',
    render: () => (
      <div className="flex flex-col gap-8">
        <Standings stage={roundRobinStage} />
        <Sheet
          stage={roundRobinStage}
          style={{
            ['--card-width' as string]: '11rem',
            ['--rb-column-gap' as string]: '1rem',
          }}
        />
      </div>
    ),
  },
  {
    id: 'swiss',
    label: 'Swiss',
    call: 'swiss(teams)',
    note: 'Equal records meet each round, and nobody plays the same opponent twice.',
    render: () => (
      <div className="flex flex-col gap-8">
        <Standings stage={swissStage} />
        <Sheet
          stage={swissStage}
          style={{
            ['--card-width' as string]: '12rem',
            ['--rb-column-gap' as string]: '1.25rem',
          }}
        />
      </div>
    ),
  },
] as const;

export function FormatShowcase() {
  const [active, setActive] = useState<(typeof formats)[number]['id']>('single');
  const format = formats.find((item) => item.id === active) ?? formats[0];

  return (
    <div className="grid overflow-hidden rounded-[1.25rem] bg-card ring-1 ring-border lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div
        role="tablist"
        aria-label="Formats"
        aria-orientation="vertical"
        className="flex overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:py-3"
      >
        {formats.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`format-${item.id}`}
              aria-selected={selected}
              aria-controls="format-panel"
              onClick={() => setActive(item.id)}
              className={cn(
                'relative flex shrink-0 flex-col items-start gap-1 px-4 py-3.5 text-start transition-colors focus-visible:-outline-offset-2 lg:px-6',
                'before:absolute before:inset-x-5 before:bottom-0 before:h-0.5 before:rounded-full lg:before:inset-x-auto lg:before:inset-y-3 lg:before:left-0 lg:before:h-auto lg:before:w-0.5',
                selected ? 'before:bg-brand' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="font-display text-lg tracking-[-0.01em] lg:text-[1.375rem]">
                {item.label}
              </span>
              <span
                className={cn(
                  'hidden max-w-[15rem] text-[13px] leading-snug text-muted-foreground lg:block',
                  !selected && 'lg:hidden',
                )}
              >
                {item.note}
              </span>
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id="format-panel"
        aria-labelledby={`format-${format.id}`}
        className="court-surface relative flex min-w-0 flex-col gap-6 bg-court p-4 text-white sm:p-8 lg:min-h-[38rem] lg:p-10"
      >
        <code className="self-start rounded-md bg-white/10 px-2.5 py-1 font-mono text-[12.5px] text-white/85">
          {format.call}
        </code>
        <p className="-mt-2 text-sm text-white/70 lg:hidden">{format.note}</p>
        <div key={format.id} className="min-w-0">
          {format.render()}
        </div>
      </div>
    </div>
  );
}

const sampleBase = play(singleElimination(teams(8)), 0.6);
const sampleReady = sampleBase.groups[0]?.rounds
  .flatMap((round) => round.matches)
  .find((match) => match.status === 'ready');
const sample = sampleReady
  ? reportResult(sampleBase, sampleReady.id, { scores: [2, 1], live: true })
  : sampleBase;

/** Shared by every layer of the comparison, so the before and after line up exactly. */
const frame: Partial<BracketProps> = {
  stage: sample,
  mode: 'fit',
  compactBelow: 0,
  highlightOnHover: true,
};

const rawClasses: ClassNames = {
  content: 'gap-x-20',
  'round-title': 'text-start text-[13px] text-neutral-500',
  cell: 'py-2',
  match: 'w-60 border border-neutral-300 bg-white',
  participant:
    'flex items-center justify-between px-2 not-first:border-t not-first:border-neutral-200',
  connector: 'fill-none stroke-neutral-400',
};

const tailwindClasses: ClassNames = {
  content: 'gap-x-20',
  'round-title': 'text-start text-[13px] font-medium text-white/60',
  cell: 'py-2',
  match:
    'w-60 overflow-hidden rounded-md border border-white/10 bg-[#142b63] text-white data-highlighted:border-optic',
  participant:
    'flex items-center justify-between px-3 text-sm not-first:border-t not-first:border-white/10 data-winner:bg-optic data-winner:font-semibold data-winner:text-[#10213f] data-loser:text-white/45',
  connector: 'fill-none stroke-white/30 [stroke-width:2] data-highlighted:stroke-optic',
};

function ScoreBug({ match }: { match: Match }) {
  const live = match.status === 'live';
  return (
    <Bracket.Match
      className={({ highlighted }) =>
        cn(
          'relative w-60 overflow-hidden rounded-[3px] border border-transparent bg-[#0b1630] text-white shadow-[0_12px_24px_-14px_rgb(0_0_0/0.8)]',
          highlighted && 'border-optic',
        )
      }
    >
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant
          key={slot}
          slot={slot}
          className="flex items-stretch not-first:border-t not-first:border-white/8 data-loser:[&>span:nth-child(2)]:text-white/45"
        >
          {({ participant, winner, slot: { score } }) => (
            <>
              <span
                aria-hidden
                className="w-1.5 shrink-0"
                style={{ background: teamColour(participant?.id) }}
              />
              <span className="flex flex-1 items-center truncate px-3 text-[13px] font-semibold tracking-[0.02em]">
                {participant?.name ?? 'To be decided'}
              </span>
              <span
                className={cn(
                  'grid w-10 place-items-center bg-white/6 font-display text-xl tabular-nums',
                  winner && 'bg-white text-[#0b1630]',
                  live && 'bg-[#1e3f8c]',
                )}
              >
                {score ?? ''}
              </span>
            </>
          )}
        </Bracket.Participant>
      ))}
    </Bracket.Match>
  );
}

const skins = [
  {
    id: 'theme',
    label: 'Theme variables',
    summary:
      'Load the optional stylesheet and change a few custom properties. Colours, radius, line weight and spacing all follow.',
    scene: 'bg-[#eef2f8]',
    layer: (
      <Bracket
        {...frame}
        stage={sample}
        connectorRadius={14}
        classNames={{ 'round-title': 'text-start normal-case tracking-normal text-[13px]' }}
        style={{
          ['--rb-text' as string]: '#10213f',
          ['--rb-text-muted' as string]: '#5a6a86',
          ['--rb-surface' as string]: '#ffffff',
          ['--rb-border' as string]: '#d6deea',
          ['--rb-accent' as string]: '#1e3f8c',
          ['--rb-live' as string]: '#6f8fd8',
          ['--rb-line' as string]: '#9fb0cc',
          ['--rb-line-width' as string]: '2px',
          ['--rb-radius' as string]: '14px',
          ['--rb-shadow' as string]: '0 10px 24px -14px rgb(16 33 63 / 0.35)',
          ['--rb-match-width' as string]: '15rem',
          ['--rb-match-gap' as string]: '1rem',
          ['--rb-column-gap' as string]: '5rem',
        }}
      />
    ),
    code: `import '@react-brackets/theme/theme.css';

<Bracket stage={stage} className="club" connectorRadius={14} />

/* styles.css */
.club {
  --rb-accent: #1e3f8c;
  --rb-radius: 14px;
  --rb-line-width: 2px;
  --rb-shadow: 0 10px 24px -14px rgb(16 33 63 / 0.35);
}`,
  },
  {
    id: 'tailwind',
    label: 'Tailwind classes',
    summary:
      'Opt out of the theme and pass a class for any part. State arrives as data attributes, so variants like data-winner just work.',
    scene: 'bg-[#10213f]',
    layer: <Bracket {...frame} stage={sample} unstyled classNames={tailwindClasses} />,
    code: `<Bracket
  stage={stage}
  unstyled
  classNames={{
    match: 'w-60 rounded-md border border-white/10 bg-[#142b63]',
    participant:
      'flex justify-between px-3 data-winner:bg-optic data-loser:text-white/45',
    connector: 'stroke-white/30 data-highlighted:stroke-optic',
  }}
/>`,
  },
  {
    id: 'card',
    label: 'Your own card',
    summary:
      'Draw the match yourself with renderMatch. Connectors, highlighting and keyboard support keep working around it.',
    scene: 'court-surface bg-court',
    layer: (
      <Bracket
        {...frame}
        stage={sample}
        connectorRadius={0}
        classNames={{
          'round-title': 'text-start normal-case tracking-normal text-[13px] text-white/65',
          connector: 'stroke-white/35 data-highlighted:stroke-optic',
        }}
        style={{
          ['--rb-match-gap' as string]: '1rem',
          ['--rb-column-gap' as string]: '5rem',
        }}
        renderMatch={(match) => <ScoreBug match={match} />}
      />
    ),
    code: `<Bracket
  stage={stage}
  renderMatch={(match) => (
    <Bracket.Match className="w-60 rounded-[3px] bg-[#0b1630] text-white">
      {[0, 1].map((slot) => (
        <Bracket.Participant key={slot} slot={slot}>
          {({ participant, winner, slot }) => (
            <ScoreRow team={participant} score={slot.score} winner={winner} />
          )}
        </Bracket.Participant>
      ))}
    </Bracket.Match>
  )}
/>`,
  },
];

/** Drags a divider across two layers of the same bracket: plain markup on the left, the styled one on the right. */
function Wipe({ before, after }: { before: ReactNode; after: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [split, setSplit] = useState(50);
  const [sweeping, setSweeping] = useState(false);

  // Once, when the comparison first scrolls into view, the divider sweeps across to show it can move.
  useEffect(() => {
    const element = ref.current;
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setSweeping(true);
        const steps: [number, number][] = [
          [200, 74],
          [1000, 28],
          [1800, 50],
        ];
        for (const [at, value] of steps) timers.push(setTimeout(() => setSplit(value), at));
        timers.push(setTimeout(() => setSweeping(false), 2600));
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      for (const timer of timers) clearTimeout(timer);
    };
  }, []);

  const moveTo = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setSweeping(false);
    setSplit(Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)));
  };

  const ease = sweeping ? 'transition-[clip-path,left] duration-700 ease-in-out' : '';

  return (
    <div
      ref={ref}
      className="wipe relative cursor-ew-resize touch-pan-y select-none overflow-hidden"
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        moveTo(event.clientX);
      }}
      onPointerMove={(event) => dragging.current && moveTo(event.clientX)}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      {after}
      <div
        className={cn('absolute inset-0', ease)}
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      >
        {before}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(split)}
        onChange={(event) => {
          setSweeping(false);
          setSplit(Number(event.target.value));
        }}
        aria-label="Compare the unstyled bracket with the styled one"
        className="peer sr-only"
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-optic peer-focus-visible:[&>span]:ring-4 peer-focus-visible:[&>span]:ring-white',
          ease,
        )}
        style={{ left: `${split}%` }}
      >
        <span className="absolute top-1/2 left-1/2 grid size-10 -translate-1/2 place-items-center rounded-full bg-optic text-[#10213f] shadow-[0_6px_20px_-6px_rgb(0_0_0/0.6)]">
          <svg
            aria-hidden
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6.5 4.5 2 9l4.5 4.5M11.5 4.5 16 9l-4.5 4.5" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function Scene({
  className,
  tag,
  children,
}: {
  className: string;
  tag: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('relative h-full px-4 pt-14 pb-8 sm:px-10 sm:pt-16 sm:pb-10', className)}>
      <span className="absolute top-4 rounded-full bg-black/5 px-3 py-1 text-[12px] font-medium sm:top-5 [.scene-before_&]:left-4 [.scene-before_&]:sm:left-10 [.scene-after_&]:right-4 [.scene-after_&]:sm:right-10">
        {tag}
      </span>
      <div className="mx-auto max-w-[57rem]">{children}</div>
    </div>
  );
}

export function StylingShowcase() {
  const [active, setActive] = useState('card');
  const skin = skins.find((item) => item.id === active) ?? skins[0];
  if (!skin) return null;

  return (
    <div className="flex flex-col gap-8">
      <div
        role="tablist"
        aria-label="Styling approaches"
        className="flex gap-1 self-stretch rounded-full bg-muted p-1 sm:self-start"
      >
        {skins.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`skin-${item.id}`}
            aria-selected={item.id === active}
            aria-controls="skin-panel"
            onClick={() => setActive(item.id)}
            className={cn(
              'flex-1 rounded-full px-2 py-2 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:flex-none sm:px-4 sm:text-sm',
              item.id === active && 'bg-background text-foreground shadow-sm',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="skin-panel"
        aria-labelledby={`skin-${skin.id}`}
        className="flex flex-col gap-8"
      >
        <div className="overflow-hidden rounded-[1.25rem] ring-1 ring-border">
          <Wipe
            before={
              <div className="scene-before h-full">
                <Scene className="bg-white font-serif text-black" tag="Unstyled markup">
                  <Bracket {...frame} stage={sample} unstyled classNames={rawClasses} />
                </Scene>
              </div>
            }
            after={
              <div key={skin.id} className="scene-after">
                <Scene
                  className={cn(
                    skin.scene,
                    skin.id !== 'theme' && 'text-white [&>span]:bg-white/10',
                  )}
                  tag={skin.label}
                >
                  {skin.layer}
                </Scene>
              </div>
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <p className="max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">
            {skin.summary}
          </p>
          <div className="min-w-0 [&_figure]:my-0">
            <DynamicCodeBlock lang="tsx" code={skin.code} />
          </div>
        </div>
      </div>
    </div>
  );
}
