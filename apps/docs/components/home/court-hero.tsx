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
import { useLiveStage } from '@/components/demos/motion';
import { CourtPlan, LiveDot, TeamChip } from '@/components/home/court';
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
  const round = stage.groups[0]?.rounds.find((item) =>
    item.matches.some((match) => match.status !== 'completed'),
  );

  return (
    <section className="court-surface relative isolate bg-court-deep text-white">
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <CourtPlan />
        <div className="court-floodlight absolute inset-0" />
        <div className="court-grain absolute inset-0" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col px-4 pt-16 sm:px-6 md:pt-24">
        <div className="flex max-w-3xl flex-col gap-6">
          <h1 className="font-display text-balance text-[clamp(3.25rem,8.5vw,6rem)]">
            Brackets that keep up with the tournament.
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/75">
            Single and double elimination, round robin and Swiss for React. Seeded, live-updating,
            swipeable on a phone, and styled with whatever you already use.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/docs"
              className="inline-flex h-11 items-center rounded-full bg-optic px-6 font-semibold text-[#10213f] transition-colors hover:bg-[#e4fb7a] focus-visible:outline-white"
            >
              Read the docs
            </Link>
            <a
              href="#playground"
              className="font-medium text-white underline-offset-4 hover:underline focus-visible:outline-white"
            >
              Try the playground
            </a>
            <InstallCommand />
          </div>
        </div>

        <figure className="relative z-10 mt-14 -mb-28 overflow-hidden rounded-[1.25rem] bg-[#0c1f4d] shadow-[0_40px_80px_-40px_rgb(5_12_30/0.9),inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-white/10 md:mt-20">
          <figcaption className="flex flex-col gap-1 border-b border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
            <span className="flex items-baseline gap-3">
              <span className="font-display text-[1.6rem]">Spring Open</span>
              <span className="text-sm text-white/55">
                {round ? `${round.name}, 16 teams` : 'Final, 16 teams'}
              </span>
            </span>
            <span
              aria-live="polite"
              className="flex min-h-6 min-w-0 items-center gap-2.5 text-sm text-white/75 tabular-nums"
            >
              <LiveDot className="shrink-0" />
              <span className="truncate">
                {current ? (
                  <>
                    <span className="font-semibold text-optic">{current.name}</span>{' '}
                    {current.next ? `are through to the ${current.next}.` : 'win the title.'}
                  </>
                ) : (
                  'The draw is set. First matches are under way.'
                )}
              </span>
            </span>
          </figcaption>
          <div className="px-3 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-5">
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
        </figure>
      </div>
    </section>
  );
}

/**
 * A match card painted for the court. The highlighted path always wins over the live state, so the leader's
 * card stays optic while a live match is shown by its pulsing dot alone.
 */
export function CourtCard({ match }: { match: Match }) {
  const live = match.status === 'live';
  return (
    <Bracket.Match
      className={({ highlighted }) =>
        cn(
          'relative w-56 rounded-lg bg-white/[0.06] ring-1 transition-[box-shadow,background-color] duration-300',
          highlighted ? 'ring-optic/80' : live ? 'bg-white/[0.1] ring-white/45' : 'ring-white/12',
        )
      }
    >
      {live && (
        <span className="absolute top-1.5 right-1.5 flex">
          <LiveDot className="size-1.5" />
        </span>
      )}
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant
          key={slot}
          slot={slot}
          className="flex h-9 items-center gap-2.5 px-2.5 text-sm not-first:border-t not-first:border-white/8 data-loser:opacity-45 data-entered:bg-optic/10"
        >
          {({ participant, winner, slot: { score } }) => (
            <>
              <TeamChip id={participant?.id} name={participant?.name} />
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
                className={cn(
                  'w-4 text-end tabular-nums',
                  winner ? 'font-semibold text-optic' : 'text-white/70',
                  live && 'me-2',
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

/** A soft curve between cards; the leader's path flows in optic. */
export function CourtLine({ line }: { line: ConnectorState }) {
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
      className="group inline-flex h-11 max-w-full items-center gap-3 rounded-full bg-white/8 px-5 font-mono text-[13px] text-white/85 ring-1 ring-white/10 transition-colors hover:bg-white/14 focus-visible:outline-white sm:text-sm"
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
