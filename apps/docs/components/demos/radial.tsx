'use client';

import { RotateCcw, StepForward, Trophy } from 'lucide-react';
import { useState } from 'react';
import {
  allMatches,
  type Id,
  participantMap,
  reportResult,
  type Stage,
  singleElimination,
} from 'react-brackets';
import { Button } from '@/components/ui/button';
import { play, scoresFor, teams } from './data';

const SIZE = 640;
const CENTER = SIZE / 2;
/** Space left empty at the top and bottom, so the two halves read as two sides. */
const GAP = 0.1;

interface Spot {
  /** Who stands here, or `null` while it is still to be decided. */
  participantId: Id | null;
  /** The ring, from 0 on the outside to the champion in the middle. */
  ring: number;
  /** Where on the ring, in radians, counting anticlockwise from the right. */
  angle: number;
  /** How far from the middle. */
  radius: number;
  x: number;
  y: number;
}

const place = (ring: number, angle: number, radius: number, participantId: Id | null): Spot => ({
  participantId,
  ring,
  angle,
  radius,
  // Rounded, so the server and the browser write the same numbers.
  x: Math.round((CENTER + radius * Math.cos(angle)) * 100) / 100,
  y: Math.round((CENTER - radius * Math.sin(angle)) * 100) / 100,
});

/**
 * Every team at every stage it reached, placed on rings: the outer ring is the
 * first round, each ring further in is the next round, and the champion sits in
 * the middle. Only the core is used: each round's slots say who stands where.
 */
function rings(stage: Stage): { spots: Spot[][]; links: [Spot, Spot][] } {
  const rounds = stage.groups[0]?.rounds ?? [];
  const final = rounds.at(-1)?.matches[0];
  const occupants = rounds.map((round) =>
    round.matches.flatMap((match) => match.slots.map((slot) => slot.participantId)),
  );
  occupants.push([final && final.winner !== null ? final.slots[final.winner].participantId : null]);

  const middle = occupants.length - 1;
  // Rings evenly apart, from the edge in to the finalists, who stand clear of the champion.
  const outer = CENTER - 24;
  const inner = 74;
  const radiusOf = (ring: number) =>
    ring === middle ? 0 : outer - ((outer - inner) * ring) / Math.max(1, middle - 1);

  // The first round runs down the left side and then down the right, leaving a gap at the top and bottom.
  const count = occupants[0]?.length ?? 0;
  const half = count / 2;
  const sweep = Math.PI - 2 * GAP;
  let angles = Array.from({ length: count }, (_, index) => {
    const along = ((index % half) + 0.5) / half;
    return index < half ? Math.PI / 2 + GAP + along * sweep : Math.PI / 2 - GAP - along * sweep;
  });

  const spots = occupants.map((ids, ring) => {
    // Each spot sits between the two it comes from; the finalists face each other across the middle.
    if (ring > 0)
      angles = ids.map((_, index) => ((angles[index * 2] ?? 0) + (angles[index * 2 + 1] ?? 0)) / 2);
    if (ring === middle - 1) angles = [Math.PI, 0];
    return ids.map((id, index) => place(ring, angles[index] ?? 0, radiusOf(ring), id));
  });

  const links = spots.flatMap((ring, depth) =>
    ring.flatMap((spot, index): [Spot, Spot][] => {
      const target = spots[depth + 1]?.[Math.floor(index / 2)];
      return target ? [[spot, target]] : [];
    }),
  );
  return { spots, links };
}

/** Leaves a team along its spoke, then curves round into the spot it moved to. */
function linkPath([from, to]: [Spot, Spot]): string {
  const bend = place(0, from.angle, to.radius + (from.radius - to.radius) * 0.35, null);
  return `M${from.x},${from.y} Q${bend.x},${bend.y} ${to.x},${to.y}`;
}

/** A steady colour per team, so the same team always looks the same. */
function hue(id: Id): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}

// Up to the semifinals, so a few results crown a champion.
const start = () => play(singleElimination(teams(32)), 28 / 31);

export function RadialDemo() {
  const [stage, setStage] = useState(start);
  const [focus, setFocus] = useState<Id | null>(null);
  const names = participantMap(stage);
  const { spots, links } = rings(stage);
  const middle = spots.length - 1;
  const next = allMatches(stage).find((match) => match.status === 'ready');
  const lit = (spot: Spot) => focus !== null && spot.participantId === focus;
  // Out once a team stands on a ring and is missing from the next one in.
  const out = (spot: Spot) => {
    const further = spots[spot.ring + 1];
    if (!spot.participantId || !further) return false;
    const decided = further.some((other) => other.participantId !== null);
    return decided && !further.some((other) => other.participantId === spot.participantId);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[36rem] select-none"
        role="img"
        aria-label="A 32-team bracket drawn as rings, with the champion in the middle"
      >
        <defs>
          <radialGradient id="radial-glow">
            <stop offset="0%" stopColor="oklch(0.8 0.15 85)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="oklch(0.8 0.15 85)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={CENTER} cy={CENTER} r={CENTER * 0.55} fill="url(#radial-glow)" />

        <g className="text-fd-muted-foreground" fill="none" stroke="currentColor">
          {links.map((link) => {
            const on = lit(link[0]) && lit(link[1]);
            return (
              <path
                key={`${link[0].ring}-${link[0].x}-${link[0].y}`}
                d={linkPath(link)}
                strokeWidth={on ? 2.5 : 1}
                strokeOpacity={on ? 1 : 0.35}
                className={on ? 'text-amber-500' : undefined}
                stroke={on ? 'currentColor' : undefined}
              />
            );
          })}
        </g>

        {spots.flat().map((spot) => {
          const size = spot.ring === middle ? 36 : 12 + spot.ring * 2.5;
          const name = spot.participantId ? names.get(spot.participantId)?.name : undefined;
          const key = `${spot.ring}-${spot.x}-${spot.y}`;
          if (!spot.participantId || !name) {
            return (
              <circle
                key={key}
                cx={spot.x}
                cy={spot.y}
                r={size * 0.75}
                className="text-fd-muted-foreground"
                fill="currentColor"
                fillOpacity={0.06}
                stroke="currentColor"
                strokeOpacity={0.45}
                strokeDasharray="3 3"
              />
            );
          }
          const color = hue(spot.participantId);
          return (
            <g
              key={key}
              onPointerEnter={() => setFocus(spot.participantId)}
              onPointerLeave={() => setFocus(null)}
              opacity={out(spot) && !lit(spot) ? 0.35 : 1}
              style={{ transition: 'opacity 200ms' }}
            >
              <title>{name}</title>
              <circle
                cx={spot.x}
                cy={spot.y}
                r={size}
                fill={`oklch(0.62 0.14 ${color})`}
                stroke={lit(spot) || spot.ring === middle ? 'white' : 'none'}
                strokeWidth={2}
              />
              <text
                x={spot.x}
                y={spot.y}
                dy="0.35em"
                textAnchor="middle"
                fill="white"
                fontSize={size * 0.8}
                fontWeight={600}
              >
                {name.slice(0, 2)}
              </text>
            </g>
          );
        })}

        {spots[middle]?.[0]?.participantId && (
          <Trophy
            x={CENTER - 11}
            y={CENTER - 68}
            width={22}
            height={22}
            className="text-amber-500"
          />
        )}
      </svg>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!next}
          onClick={() =>
            next && setStage(reportResult(stage, next.id, { scores: scoresFor(next.id) }))
          }
        >
          <StepForward /> Next result
        </Button>
        <Button size="sm" variant="outline" onClick={() => setStage(start())}>
          <RotateCcw /> Start over
        </Button>
      </div>
    </div>
  );
}
