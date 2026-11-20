import type { Id, Stage } from '@react-brackets/native';

/** One team at one stage of the tournament, placed on a ring. */
export interface Spot {
  /** Who stands here, or `null` while it is still to be decided. */
  participantId: Id | null;
  /** The ring: 0 is the first round, on the outside, and the last ring is the champion, in the middle. */
  ring: number;
  /** Its place on the ring, top to bottom down the left side, then down the right. */
  index: number;
  /** Where on the ring, in radians, anticlockwise from the right. */
  angle: number;
  /** How far from the middle. */
  radius: number;
  x: number;
  y: number;
}

/** A line from a team to the spot it moved into. */
export interface Link {
  from: Spot;
  to: Spot;
}

export interface Rings {
  /** One list per ring, from the outside in. */
  spots: Spot[][];
  links: Link[];
  /** The ring the champion stands on. */
  middle: number;
}

/** Space left at the top and bottom, so the two halves read as two sides. */
const GAP = 0.1;

/**
 * Places every team of a single elimination stage on rings around its champion.
 *
 * - Ring 0 is the first round's slots, ring 1 the second round's, and so on. The middle is the final's winner.
 * - The first ring runs down the left side, then down the right, so the two halves meet at the final.
 * - Every spot further in sits halfway between the two spots it comes from.
 *
 * Only the core's data is used, so this works with any stage, live results included.
 */
export function rings(stage: Stage, size: number): Rings {
  const center = size / 2;
  const rounds = stage.groups[0]?.rounds ?? [];
  const final = rounds.at(-1)?.matches[0];

  // Who stands on each ring: every slot of every round, then the champion.
  const occupants = rounds.map((round) =>
    round.matches.flatMap((match) => match.slots.map((slot) => slot.participantId)),
  );
  occupants.push([final && final.winner !== null ? final.slots[final.winner].participantId : null]);
  const middle = occupants.length - 1;

  // Rings evenly apart, from near the edge in to the finalists, who stand clear of the champion.
  const outer = center * 0.92;
  const inner = center * 0.23;
  const radiusOf = (ring: number) =>
    ring === middle ? 0 : outer - ((outer - inner) * ring) / Math.max(1, middle - 1);

  // The first ring: down the left side, then down the right.
  const count = occupants[0]?.length ?? 0;
  const half = count / 2;
  const sweep = Math.PI - 2 * GAP;
  let angles = Array.from({ length: count }, (_, index) => {
    const along = ((index % half) + 0.5) / half;
    return index < half ? Math.PI / 2 + GAP + along * sweep : Math.PI / 2 - GAP - along * sweep;
  });

  const place = (ring: number, index: number, angle: number, participantId: Id | null): Spot => {
    const radius = radiusOf(ring);
    return {
      participantId,
      ring,
      index,
      angle,
      radius,
      // Rounded, so a server and a browser write the same numbers.
      x: Math.round((center + radius * Math.cos(angle)) * 100) / 100,
      y: Math.round((center - radius * Math.sin(angle)) * 100) / 100,
    };
  };

  const spots = occupants.map((ids, ring) => {
    if (ring > 0) {
      angles = ids.map((_, index) => ((angles[index * 2] ?? 0) + (angles[index * 2 + 1] ?? 0)) / 2);
    }
    // The two finalists face each other across the middle.
    if (ring === middle - 1) angles = [Math.PI, 0];
    return ids.map((id, index) => place(ring, index, angles[index] ?? 0, id));
  });

  // Each spot is joined to the one it moves into: spot `i` feeds spot `i / 2` on the next ring in.
  const links = spots.flatMap((ring, depth) =>
    ring.flatMap((from, index): Link[] => {
      const to = spots[depth + 1]?.[Math.floor(index / 2)];
      return to ? [{ from, to }] : [];
    }),
  );

  return { spots, links, middle };
}

/** SVG path data for a link: it leaves along the team's spoke, then curves into the spot it moved to. */
export function linkPath({ from, to }: Link, size: number): string {
  const center = size / 2;
  const radius = to.radius + (from.radius - to.radius) * 0.35;
  const bendX = center + radius * Math.cos(from.angle);
  const bendY = center - radius * Math.sin(from.angle);
  return `M${from.x},${from.y} Q${bendX.toFixed(2)},${bendY.toFixed(2)} ${to.x},${to.y}`;
}

/** `true` once someone else has taken the spot this team was playing for: it is out. */
export function isOut(spot: Spot, { spots }: Rings): boolean {
  const next = spots[spot.ring + 1]?.[Math.floor(spot.index / 2)];
  return (
    spot.participantId !== null &&
    next !== undefined &&
    next.participantId !== null &&
    next.participantId !== spot.participantId
  );
}

/** A steady hue per team, so the same team always has the same colour. */
export function hue(id: Id): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}
