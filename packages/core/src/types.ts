/** A unique identifier. Generated ids are readable, like `main.r1.m1`. */
export type Id = string;

/** Free-form data you attach to participants, matches or groups, like a logo, a venue or a stream link. */
export type Meta = Record<string, unknown>;

/** Which side of a match: `0` is the top (or home) slot, `1` the bottom (or away) slot. */
export type SlotIndex = 0 | 1;

/** A team or player taking part in a stage. */
export interface Participant {
  /** Unique within the stage. Results and highlighting refer to participants by id. */
  id: Id;
  /** Shown in the bracket. */
  name: string;
  /** Anything else you want to render, such as a logo, a country or a rating. */
  meta?: Meta;
}

/** Where a slot gets its participant from, once that match is decided. */
export interface SlotOrigin {
  /** The match that feeds this slot. */
  matchId: Id;
  /** Whether the winner or the loser of that match moves here. Losers feed losers brackets and third place matches. */
  outcome: 'winner' | 'loser';
}

/** One side of a match. */
export interface Slot {
  /** The participant in this slot, or `null` while it is still to be decided. */
  participantId: Id | null;
  /** Set when this slot is filled by the result of another match. */
  origin?: SlotOrigin;
  /** The score on this side. Present once a score has been reported. */
  score?: number;
  /** `true` when there is no opponent, so the other side advances without playing. */
  bye?: boolean;
}

/**
 * - `waiting`: at least one side is still to be decided.
 * - `ready`: both sides are known and the match can be played.
 * - `live`: in progress, reported with `live: true`.
 * - `completed`: finished, or resolved by a bye.
 * - `skipped`: will never be played, like an unused bracket reset.
 */
export type MatchStatus = 'waiting' | 'ready' | 'live' | 'completed' | 'skipped';

/** A match that only takes place when another one ends a certain way, like a grand final reset. */
export interface MatchCondition {
  /** The match this one depends on. */
  matchId: Id;
  /** This match is played only if that match is won by this slot. */
  winner: SlotIndex;
}

/** A single match between two slots. */
export interface Match {
  /** Unique within the stage, like `main.r1.m1` (round 1, match 1). */
  id: Id;
  /** The two sides, top first. */
  slots: [Slot, Slot];
  /** Where the match is in its lifecycle. */
  status: MatchStatus;
  /** The winning slot, or `null` while undecided or after a draw. */
  winner: SlotIndex | null;
  /** Set on conditional matches such as a bracket reset. */
  playedIf?: MatchCondition;
  /** When the match starts, as any string you like to display. */
  scheduledAt?: string;
  /** Anything else you want to render, such as a venue or a stream link. */
  meta?: Meta;
}

/** A column of matches played at the same stage of the competition. */
export interface Round {
  /** Unique within the stage, like `main.r1`. */
  id: Id;
  /** Shown above the round, like `Semifinals`. */
  name: string;
  /** In display order, top to bottom. */
  matches: Match[];
}

/**
 * What a group is for, which decides how `<Bracket>` titles and arranges it.
 * - `bracket`: a knockout bracket.
 * - `winners` / `losers` / `grand-final`: the parts of a double elimination stage.
 * - `third-place`: the match between the semifinal losers.
 * - `pool`: a round robin group or a Swiss table.
 */
export type GroupKind = 'bracket' | 'winners' | 'losers' | 'grand-final' | 'third-place' | 'pool';

/** A set of rounds drawn together, like a winners bracket or a round robin group. */
export interface Group {
  /** Unique within the stage, like `main.wb`. */
  id: Id;
  /** What the group is for. */
  kind: GroupKind;
  /** Shown above the group when the stage has several, like `Losers bracket`. */
  name: string;
  /** In order of play. */
  rounds: Round[];
  /** Format settings, such as the planned number of Swiss rounds. */
  meta?: Meta;
}

/** The format a stage was built with. `custom` stages come from `fromRounds`. */
export type StageFormat =
  | 'single-elimination'
  | 'double-elimination'
  | 'round-robin'
  | 'swiss'
  | 'custom';

/**
 * A whole competition phase: its participants and every match. Stages are plain,
 * serialisable objects: store them, send them over the network, and pass them to
 * `<Bracket>`. Every update returns a new stage.
 */
export interface Stage {
  /** The `id` option you passed, `main` by default. Prefixes every group, round and match id. */
  id: Id;
  /** The format the stage was built with. */
  format: StageFormat;
  /** In seed order. */
  participants: Participant[];
  /** One for a simple bracket, several for double elimination, groups or a third place match. */
  groups: Group[];
}
