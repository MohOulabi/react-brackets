import type { Group, Id, Participant, Stage } from './types';

/** One row of a league table. */
export interface Standing {
  /** Who this row is for. */
  participantId: Id;
  /** Matches completed, byes included. */
  played: number;
  /** Matches won, byes included. */
  wins: number;
  /** Matches completed without a winner. */
  draws: number;
  /** Matches lost. */
  losses: number;
  /** Total of this participant's own scores. */
  scored: number;
  /** Total of the opponents' scores. */
  conceded: number;
  /** From wins, draws and losses, using `StandingsOptions.points`. */
  points: number;
}

export interface StandingsOptions {
  /**
   * Points for each outcome.
   * @defaultValue { win: 3, draw: 1, loss: 0 }
   */
  points?: { win: number; draw: number; loss: number };
}

const defaultPoints = { win: 3, draw: 1, loss: 0 };

/**
 * Builds a league table from completed matches, ranked by points, then score
 * difference, then score, then seed. A bye counts as a win without scores.
 *
 * @param groupId Ranks a single group. Leave out to rank the whole stage, as for Swiss.
 */
export function standings(stage: Stage, groupId?: Id, options: StandingsOptions = {}): Standing[] {
  const points = options.points ?? defaultPoints;
  const groups = groupId ? stage.groups.filter((group) => group.id === groupId) : stage.groups;
  const rows = new Map<Id, Standing>();

  const row = (participantId: Id) => {
    let entry = rows.get(participantId);
    if (!entry) {
      entry = {
        participantId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        scored: 0,
        conceded: 0,
        points: 0,
      };
      rows.set(participantId, entry);
    }
    return entry;
  };

  for (const match of matchesOf(groups)) {
    for (const slot of match.slots) if (slot.participantId) row(slot.participantId);
    if (match.status !== 'completed') continue;

    match.slots.forEach((slot, index) => {
      if (!slot.participantId) return;
      const entry = row(slot.participantId);
      const opponent = match.slots[index === 0 ? 1 : 0];
      entry.played += 1;
      entry.scored += slot.score ?? 0;
      entry.conceded += opponent.score ?? 0;
      if (match.winner === null) {
        entry.draws += 1;
        entry.points += points.draw;
      } else if (match.winner === index) {
        entry.wins += 1;
        entry.points += points.win;
      } else {
        entry.losses += 1;
        entry.points += points.loss;
      }
    });
  }

  const seed = seedLookup(stage.participants);
  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.scored - b.conceded - (a.scored - a.conceded) ||
      b.scored - a.scored ||
      seed(a.participantId) - seed(b.participantId),
  );
}

/**
 * The top `perGroup` finishers of every group, ordered by placing and then by
 * group: A1, B1, A2, B2. Feed them to `singleElimination` and standard seeding
 * pairs each group winner with another group's runner-up.
 */
export function qualifiers(
  stage: Stage,
  perGroup: number,
  options?: StandingsOptions,
): Participant[] {
  const byId = new Map(stage.participants.map((participant) => [participant.id, participant]));
  const tables = stage.groups.map((group) => standings(stage, group.id, options));
  const qualified: Participant[] = [];

  for (let place = 0; place < perGroup; place++) {
    for (const table of tables) {
      const participant = byId.get(table[place]?.participantId ?? '');
      if (participant) qualified.push(participant);
    }
  }
  return qualified;
}

function matchesOf(groups: Group[]) {
  return groups.flatMap((group) => group.rounds.flatMap((round) => round.matches));
}

function seedLookup(participants: Participant[]): (id: Id) => number {
  const order = new Map(participants.map((participant, index) => [participant.id, index]));
  return (id) => order.get(id) ?? Number.MAX_SAFE_INTEGER;
}
