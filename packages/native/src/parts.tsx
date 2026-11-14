import type { Match, Participant, Round, Slot, SlotIndex } from '@react-brackets/core';
import { createContext, type ReactNode, useContext, useLayoutEffect } from 'react';
import { Text, type TextStyle, View, type ViewProps, type ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  PressContext,
  RootContext,
  resolveStyle,
  type StyleOf,
  useBracket,
  useMatch,
  useParts,
} from './context';

export interface MatchState {
  match: Match;
  live: boolean;
  completed: boolean;
  /** `true` when the highlighted participant plays in this match. */
  highlighted: boolean;
  /** `true` while the card is pressed, when matches are pressable. */
  pressed: boolean;
}

export interface MatchProps extends Omit<ViewProps, 'style'> {
  /** A style, or a function of the match's state. */
  style?: StyleOf<MatchState, ViewStyle>;
  /** Replaces the two participants. */
  children?: ReactNode;
}

/**
 * A match card: both participants by default. Use it in `renderMatch` to restyle or fill the card.
 * With `onMatchPress`, it takes `colors.surfacePressed` while pressed.
 */
export function MatchPart({ style, children, ...props }: MatchProps): ReactNode {
  const match = useMatch();
  const { theme, highlighted } = useParts();
  const press = useContext(PressContext);
  const claim = press?.claim;
  // The card shows the press itself, so the pressable around it doesn't fade it as well.
  useLayoutEffect(() => claim?.(), [claim]);
  const state: MatchState = {
    match,
    live: match.status === 'live',
    completed: match.status === 'completed',
    highlighted:
      highlighted !== null && match.slots.some((slot) => slot.participantId === highlighted),
    pressed: press?.pressed ?? false,
  };
  return (
    <View
      {...props}
      style={[
        {
          overflow: 'hidden',
          borderWidth: 1,
          borderRadius: theme.radius,
          borderColor: state.live ? theme.colors.live : theme.colors.border,
          backgroundColor: state.pressed ? theme.colors.surfacePressed : theme.colors.surface,
        },
        resolveStyle(style, state),
      ]}
    >
      {children ?? (
        <>
          <ParticipantPart slot={0} />
          <ParticipantPart slot={1} />
        </>
      )}
    </View>
  );
}

export interface ParticipantState {
  participant: Participant | undefined;
  slot: Slot;
  winner: boolean;
  loser: boolean;
  bye: boolean;
  /** `true` while the slot is still to be decided. */
  empty: boolean;
  highlighted: boolean;
}

export interface ParticipantProps extends Omit<ViewProps, 'style' | 'children'> {
  /** Which side of the match: `0` for the top, `1` for the bottom. */
  slot: SlotIndex;
  /** A style, or a function of the participant's state. */
  style?: StyleOf<ParticipantState, ViewStyle>;
  /** Replaces the name and score, or renders from the participant's state. */
  children?: ReactNode | ((state: ParticipantState) => ReactNode);
}

/** One side of a match. Pressing it highlights the participant's path, unless matches are pressable. */
export function ParticipantPart({
  slot: index,
  style,
  children,
  ...props
}: ParticipantProps): ReactNode {
  const match = useMatch();
  const { participants, theme, labels, highlighted, highlight, onMatchPress } = useParts();
  const slot = match.slots[index];
  const participant = slot.participantId ? participants.get(slot.participantId) : undefined;
  const state: ParticipantState = {
    participant,
    slot,
    winner: match.winner === index,
    loser: match.winner !== null && match.winner !== index && !slot.bye,
    bye: slot.bye === true,
    empty: !participant && !slot.bye,
    highlighted: participant !== undefined && participant.id === highlighted,
  };
  const muted = state.loser || state.empty || state.bye;
  const text: TextStyle = {
    color: muted ? theme.colors.textMuted : theme.colors.text,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fontWeight: state.winner ? '600' : '400',
  };
  const content =
    typeof children === 'function'
      ? children(state)
      : (children ?? (
          <>
            <Text
              numberOfLines={1}
              style={[text, { flex: 1 }, state.bye && { fontStyle: 'italic' }]}
            >
              {participant?.name ?? (state.bye ? labels.bye : labels.tbd)}
            </Text>
            {slot.score !== undefined && (
              <Text
                style={[
                  text,
                  { fontVariant: ['tabular-nums'] },
                  state.winner && { color: theme.colors.accent },
                ]}
              >
                {slot.score}
              </Text>
            )}
          </>
        ));
  const look: StyleOf<ParticipantState, ViewStyle> = [
    {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: state.highlighted ? theme.colors.accentSoft : undefined,
    },
    index === 1 && { borderTopWidth: 1, borderTopColor: theme.colors.border },
  ];

  if (onMatchPress || !participant) {
    return (
      <View {...props} style={[look, resolveStyle(style, state)]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ selected: state.highlighted }}
      onPress={() => highlight(state.highlighted ? null : participant.id)}
      style={({ pressed }) => [
        look,
        pressed && { backgroundColor: theme.colors.surfacePressed },
        resolveStyle(style, state),
      ]}
    >
      {content}
    </Pressable>
  );
}

export interface RoundTitleState {
  round: Round;
  /** The round's place in its group, counting from 0. */
  index: number;
  /** `true` for the round in focus in the paged view. */
  current: boolean;
}

export interface RoundTitleProps {
  /** The round to name. */
  round: Round;
  /** A style for the default title, or a function of its state. */
  style?: StyleOf<RoundTitleState, TextStyle>;
  /** Replaces the title, or renders from its state. */
  children?: ReactNode | ((state: RoundTitleState) => ReactNode);
}

/** Set while `renderRoundTitle` draws, so a title inside it draws itself instead of calling it again. */
const InRenderedTitle = createContext(false);

/**
 * A round's name above its column. On its own it draws your `renderRoundTitle` if there is one;
 * inside `renderRoundTitle`, or given a style or children, it draws itself.
 */
export function RoundTitle({ round, style, children }: RoundTitleProps): ReactNode {
  const { theme, group, renderRoundTitle } = useBracket();
  const rendered = useContext(InRenderedTitle);
  const root = useContext(RootContext);
  if (renderRoundTitle && !rendered && style === undefined && children === undefined) {
    return <InRenderedTitle.Provider value>{renderRoundTitle(round)}</InRenderedTitle.Provider>;
  }
  const index = group.rounds.findIndex((item) => item.id === round.id);
  const state: RoundTitleState = {
    round,
    index,
    current: root?.paged === true && root.page === index,
  };
  if (typeof children === 'function') return children(state);
  if (children !== undefined) return children;
  return (
    <Text
      numberOfLines={1}
      accessibilityRole="header"
      style={[
        {
          color: theme.colors.textMuted,
          fontFamily: theme.fontFamily,
          fontSize: theme.titleFontSize,
          fontWeight: '600',
          textAlign: 'center',
        },
        resolveStyle(style, state),
      ]}
    >
      {round.name}
    </Text>
  );
}
