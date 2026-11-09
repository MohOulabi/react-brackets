import { resolve } from '../resolve';
import { createMatch, winnerOf } from '../stage';
import type {
  Group,
  GroupKind,
  Id,
  Match,
  Meta,
  Participant,
  Round,
  Slot,
  SlotIndex,
  Stage,
} from '../types';

export interface ParticipantInput {
  /** Identifies the same participant across rounds. Defaults to `name`. */
  id?: Id;
  /** Shown in the bracket. */
  name: string;
  /** This participant's score in this match. */
  score?: number;
  /** Anything else you want to render. Read from the first match the participant appears in. */
  meta?: Meta;
}

export interface MatchInput {
  /** Keeps your own ids. Defaults to `{id}.r{round}.m{match}`. */
  id?: Id;
  /** Top first. `null` for a side that is still to be decided. */
  participants: [ParticipantInput | null, ParticipantInput | null];
  /** The winning slot, once the match is decided. */
  winner?: SlotIndex | null;
  /** Marks the match as in progress. */
  live?: boolean;
  /** When the match starts, as any string you like to display. */
  scheduledAt?: string;
  /** Anything else you want to render, such as a venue or a stream link. */
  meta?: Meta;
}

export interface RoundInput {
  /** Shown above the round. */
  name: string;
  /** In display order, top to bottom. */
  matches: MatchInput[];
}

export interface FromRoundsOptions {
  /**
   * Prefixes the generated ids.
   * @defaultValue 'main'
   */
  id?: Id;
  /**
   * What the group is. Use `losers` or `pool` for data that is not a knockout tree.
   * @defaultValue 'bracket'
   */
  kind?: GroupKind;
}

/**
 * Builds a stage from rounds you already have, for example from an API or a CMS.
 * Rounds that halve in size are linked as a knockout tree and equal-sized rounds
 * one to one, so connector lines and result propagation work as with generated
 * stages. Participants you provide are kept, even without results.
 *
 * @example
 * const stage = fromRounds([
 *   { name: 'Semifinals', matches: [{ participants: [{ name: 'A' }, { name: 'B' }] }, …] },
 *   { name: 'Final', matches: [{ participants: [null, null] }] },
 * ]);
 */
export function fromRounds(rounds: RoundInput[], options: FromRoundsOptions = {}): Stage {
  const { id = 'main', kind = 'bracket' } = options;
  const participants = new Map<Id, Participant>();
  const built: Round[] = [];

  rounds.forEach((input, index) => {
    const roundId = `${id}.r${index + 1}`;
    const previous = built[index - 1]?.matches ?? [];
    const matches = input.matches.map((match, position) => {
      const origins = linkedOrigins(previous, input.matches.length, position);
      const slots: [Slot, Slot] = [
        toSlot(match.participants[0], origins?.[0], participants),
        toSlot(match.participants[1], origins?.[1], participants),
      ];
      return toMatch(match, match.id ?? `${roundId}.m${position + 1}`, slots);
    });
    built.push({ id: roundId, name: input.name, matches });
  });

  const group: Group = { id, kind, name: 'Bracket', rounds: built };
  return resolve({
    id,
    format: 'custom',
    participants: [...participants.values()],
    groups: [group],
  });
}

function linkedOrigins(previous: Match[], count: number, position: number): [Id?, Id?] | undefined {
  if (previous.length === count * 2) {
    return [previous[position * 2]?.id, previous[position * 2 + 1]?.id];
  }
  if (previous.length === count) return [previous[position]?.id, undefined];
  return undefined;
}

function toSlot(
  input: ParticipantInput | null,
  originId: Id | undefined,
  participants: Map<Id, Participant>,
): Slot {
  const slot: Slot = originId ? winnerOf(originId) : { participantId: null };
  if (!input) return slot;

  const id = input.id ?? input.name;
  if (!participants.has(id)) {
    participants.set(
      id,
      input.meta ? { id, name: input.name, meta: input.meta } : { id, name: input.name },
    );
  }
  return input.score === undefined
    ? { ...slot, participantId: id }
    : { ...slot, participantId: id, score: input.score };
}

function toMatch(input: MatchInput, id: Id, slots: [Slot, Slot]): Match {
  const match: Match = { ...createMatch(id, slots), winner: input.winner ?? null };
  if (input.live) match.status = 'live';
  if (input.scheduledAt) match.scheduledAt = input.scheduledAt;
  if (input.meta) match.meta = input.meta;
  return match;
}
