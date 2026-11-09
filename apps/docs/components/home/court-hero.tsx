'use client';

import { Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  allMatches,
  Bracket,
  type ConnectorState,
  type Match,
  participantMap,
  type Stage,
} from 'react-brackets';
import { teams } from '@/components/demos/data';
import { useLiveStage } from '@/components/demos/motion';
import { cn } from '@/lib/utils';

/** Whoever won most recently, and the round they reached. Their path is lit up on the court. */
function leader(stage: Stage): { id: string; name: string; next: string | null } | null {
  const names = participantMap(stage);
  const rounds = stage.groups[0]?.rounds ?? [];
  const decided = allMatches(stage).filter(
    (match) =>
      match.status === 'completed' &&
      match.winner !== null &&
      !match.slots.some((slot) => slot.bye),
  );
  const last = decided.at(-1);
  if (!last || last.winner === null) return null;

  const id = last.slots[last.winner].participantId;
  const index = rounds.findIndex((round) => round.matches.some((match) => match.id === last.id));
  const next = rounds[index + 1];
  const participant = id ? names.get(id) : undefined;
  if (!participant) return null;
  return { id: participant.id, name: participant.name, next: next?.name.toLowerCase() ?? null };
}

export function CourtHero() {
  const stage = useLiveStage(16, 800);
  const current = leader(stage);

  return (
    <section className="relative isolate overflow-hidden bg-court text-white">
      <CourtMarkings />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-16 pb-10 sm:px-6 md:pt-24">
        <div className="flex max-w-3xl flex-col gap-6">
          <h1 className="font-display text-balance text-[clamp(3rem,8vw,5.5rem)]">
            Brackets that keep up with the tournament.
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/75">
            Single and double elimination, round robin and Swiss for React. Seeded, live-updating,
            swipeable on a phone, and styled with whatever you already use.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/docs"
              className="inline-flex h-11 items-center rounded-full bg-optic px-6 font-semibold text-[#10213f] transition-colors hover:bg-[#e4fb7a]"
            >
              Read the docs
            </Link>
            <a
              href="#playground"
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              Try the playground
            </a>
            <InstallCommand />
          </div>
        </div>

        <div className="-mx-2">
          <Bracket
            className="court-bracket"
            stage={stage}
            mode="fit"
            connectorRadius={4}
            highlighted={current?.id ?? null}
            highlightOnHover={false}
            renderMatch={(match) => <CourtCard match={match} />}
            renderConnector={(line) => <CourtLine line={line} />}
          />
        </div>
        <p aria-live="polite" className="min-h-6 text-sm text-white/70 tabular-nums">
          {current ? (
            <>
              <span className="font-semibold text-optic">{current.name}</span>{' '}
              {current.next ? `are through to the ${current.next}.` : 'win the title.'}
            </>
          ) : (
            'The draw is set. First matches are under way.'
          )}
        </p>
      </div>
    </section>
  );
}

/** Each team keeps one colour, so you can follow it round to round. */
const colours = [
  '#7dd3fc',
  '#fda4af',
  '#fcd34d',
  '#86efac',
  '#c4b5fd',
  '#fdba74',
  '#5eead4',
  '#f9a8d4',
];
const colourOf = new Map(
  teams(16).map((team, index) => [team.id, colours[index % colours.length]]),
);

function CourtCard({ match }: { match: Match }) {
  const live = match.status === 'live';
  return (
    <Bracket.Match
      className={({ highlighted }) =>
        cn(
          'relative w-56 rounded-lg bg-white/[0.06] ring-1 ring-white/12 transition-[box-shadow,background-color] duration-300',
          live && 'bg-white/[0.09] ring-[#ffb4a2]',
          highlighted && 'ring-optic/80',
        )
      }
    >
      {live && (
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#ffb4a2] ring-2 ring-court motion-safe:animate-pulse" />
      )}
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant
          key={slot}
          slot={slot}
          className="flex h-9 items-center gap-2.5 px-2.5 text-sm not-first:border-t not-first:border-white/8 data-loser:opacity-45 data-entered:bg-optic/10"
        >
          {({ participant, winner, slot: { score } }) => (
            <>
              <span
                aria-hidden
                className="grid size-5 shrink-0 place-items-center rounded-[5px] text-[11px] font-bold text-court-deep"
                style={{
                  background: participant
                    ? colourOf.get(participant.id)
                    : 'rgb(255 255 255 / 0.12)',
                }}
              >
                {participant?.name[0]}
              </span>
              <span
                className={cn(
                  'flex-1 truncate',
                  winner && 'font-semibold',
                  !participant && 'text-white/45',
                )}
              >
                {participant?.name ?? 'To be decided'}
              </span>
              <span
                className={cn('w-4 text-end tabular-nums', winner ? 'text-optic' : 'text-white/70')}
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

/** A soft curve between cards; the leader's path flows in optic. */
function CourtLine({ line }: { line: ConnectorState }) {
  const { start, end } = line;
  const mid = (start.x + end.x) / 2;
  return (
    <Bracket.Connector
      d={`M${start.x},${start.y} C${mid},${start.y} ${mid},${end.y} ${end.x},${end.y}`}
      className={({ highlighted }) =>
        highlighted
          ? 'court-flow stroke-optic [stroke-width:2]'
          : 'stroke-white/25 [stroke-width:1.5]'
      }
    />
  );
}

function InstallCommand() {
  const command = 'npm i react-brackets @react-brackets/theme';
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="group inline-flex h-11 max-w-full items-center gap-3 rounded-full bg-white/8 px-5 font-mono text-[13px] text-white/85 transition-colors hover:bg-white/14 sm:text-sm"
      aria-label={copied ? 'Copied' : `Copy ${command}`}
    >
      <span className="truncate">{command}</span>
      {copied ? (
        <Check className="size-4 shrink-0 text-optic" />
      ) : (
        <Copy className="size-4 shrink-0 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  );
}

/** Faint service lines, so the band reads as a court rather than a coloured box. */
function CourtMarkings() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-white/[0.07]"
      preserveAspectRatio="none"
      viewBox="0 0 1200 800"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    >
      <rect x="60" y="40" width="1080" height="720" vectorEffect="non-scaling-stroke" />
      <line x1="60" y1="130" x2="1140" y2="130" vectorEffect="non-scaling-stroke" />
      <line x1="60" y1="670" x2="1140" y2="670" vectorEffect="non-scaling-stroke" />
      <line x1="600" y1="40" x2="600" y2="760" vectorEffect="non-scaling-stroke" />
      <line x1="330" y1="130" x2="330" y2="670" vectorEffect="non-scaling-stroke" />
      <line x1="870" y1="130" x2="870" y2="670" vectorEffect="non-scaling-stroke" />
      <line x1="330" y1="400" x2="870" y2="400" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
