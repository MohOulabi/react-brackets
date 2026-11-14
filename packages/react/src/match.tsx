import type {
  Match as MatchData,
  MatchStatus,
  Participant as ParticipantData,
  Slot,
  SlotIndex,
} from '@react-brackets/core';
import type { ComponentPropsWithoutRef, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { type ClassNameProp, flag, useCell, usePart, useParts } from './context';
import { useChangeFlag } from './hooks/use-change-flag';

/** How long `data-updated` and `data-entered` stay on, relative to the motion duration. */
const FLAG_LENGTH = 2.5;

/** Passed to `className` when it is a function. */
export interface MatchState {
  /** The match being drawn. */
  match: MatchData;
  /** Its status, also set as `data-status`. */
  status: MatchStatus;
  /** `true` while the highlighted participant plays in this match. */
  highlighted: boolean;
  /** Briefly `true` after the score, status or winner changes. Also set as `data-updated`. */
  updated: boolean;
}

/** The props `Bracket.Match` adds on top of a regular `div`. */
export interface MatchOwnProps {
  /** A class, or a function of the match's state. */
  className?: ClassNameProp<MatchState>;
}

/** Every `MatchOwnProps` prop, plus any prop of a `div`, like `onClick` or `style`. */
export interface MatchProps
  extends MatchOwnProps,
    Omit<ComponentPropsWithoutRef<'div'>, keyof MatchOwnProps> {}

/**
 * A match card. Connector lines attach to it, and it becomes a button when the
 * root has `onMatchClick`.
 */
export function MatchPart({ className, onClick, onKeyDown, ...props }: MatchProps): ReactNode {
  const { highlighted, onMatchClick, motion } = useParts();
  const { match } = useCell();
  const isHighlighted =
    highlighted !== null && match.slots.some((slot) => slot.participantId === highlighted);
  const updated = useChangeFlag(
    `${match.status}|${match.winner}|${match.slots[0].score}|${match.slots[1].score}`,
    motion && motion.duration * FLAG_LENGTH,
  );
  const part = usePart('match', className, {
    match,
    status: match.status,
    highlighted: isHighlighted,
    updated,
  });

  const interactive = onMatchClick
    ? {
        role: 'button',
        tabIndex: 0,
        onClick(event: MouseEvent<HTMLDivElement>) {
          onClick?.(event);
          onMatchClick(match);
        },
        onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
          onKeyDown?.(event);
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onMatchClick(match);
        },
      }
    : { onClick, onKeyDown };

  return (
    <div
      {...props}
      {...part}
      {...interactive}
      aria-current={match.status === 'live' ? 'true' : undefined}
      data-status={match.status}
      data-highlighted={flag(isHighlighted)}
      data-updated={flag(updated)}
    />
  );
}

/** Passed to `className` and to a function `children`. */
export interface ParticipantState {
  /** Who is in this slot, or `undefined` while it is to be decided or a bye. */
  participant: ParticipantData | undefined;
  /** The slot itself, with its score. */
  slot: Slot;
  /** `true` when this slot won the match. */
  winner: boolean;
  /** `true` when the other slot won the match. */
  loser: boolean;
  /** `true` when there is no opponent here. */
  bye: boolean;
  /** `true` while this participant's path is highlighted. */
  highlighted: boolean;
  /** Briefly `true` after someone moves into this slot, like a winner advancing. Also set as `data-entered`. */
  entered: boolean;
}

/** The props `Bracket.Participant` adds on top of a regular `div`. */
export interface ParticipantOwnProps {
  /** Which side of the match to draw: `0` for the top slot, `1` for the bottom one. */
  slot: SlotIndex;
  /** A class, or a function of the participant's state. */
  className?: ClassNameProp<ParticipantState>;
  /**
   * Replaces the default name and score. Pass a function to render from the
   * participant's state.
   */
  children?: ReactNode | ((state: ParticipantState) => ReactNode);
}

/** Every `ParticipantOwnProps` prop, plus any prop of a `div`, like `onClick`. */
export interface ParticipantProps
  extends ParticipantOwnProps,
    Omit<ComponentPropsWithoutRef<'div'>, keyof ParticipantOwnProps> {}

/** One side of a match: the participant's name and score by default. */
export function ParticipantPart({
  slot: index,
  className,
  children,
  onPointerEnter,
  onPointerLeave,
  ...props
}: ParticipantProps): ReactNode {
  const { participants, labels, highlighted, highlight, classNames, motion } = useParts();
  const { match } = useCell();
  const slot = match.slots[index];
  const participant = slot.participantId ? participants.get(slot.participantId) : undefined;
  const arrived = useChangeFlag(slot.participantId ?? '', motion && motion.duration * FLAG_LENGTH);
  const state: ParticipantState = {
    participant,
    slot,
    winner: match.winner === index,
    loser: match.winner !== null && match.winner !== index && !slot.bye,
    bye: slot.bye === true,
    highlighted: participant !== undefined && participant.id === highlighted,
    entered: arrived && participant !== undefined,
  };
  const part = usePart('participant', className, state);

  return (
    <div
      {...props}
      {...part}
      data-participant={participant?.id}
      data-winner={flag(state.winner)}
      data-loser={flag(state.loser)}
      data-bye={flag(state.bye)}
      data-empty={flag(!participant && !state.bye)}
      data-highlighted={flag(state.highlighted)}
      data-entered={flag(state.entered)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (participant && event.pointerType === 'mouse') highlight(participant.id);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        highlight(null);
      }}
    >
      {typeof children === 'function'
        ? children(state)
        : (children ?? (
            <>
              <span
                data-scope="bracket"
                data-part="participant-name"
                className={classNames['participant-name']}
              >
                {participant?.name ?? (state.bye ? labels.bye : labels.tbd)}
              </span>
              {slot.score !== undefined && (
                <span
                  data-scope="bracket"
                  data-part="participant-score"
                  className={classNames['participant-score']}
                >
                  {slot.score}
                </span>
              )}
            </>
          ))}
    </div>
  );
}
