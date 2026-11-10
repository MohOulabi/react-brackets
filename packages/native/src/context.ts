import type { Group, Id, Match, Participant, Round, Stage } from '@react-brackets/core';
import { type Context, createContext, type ReactNode, useContext } from 'react';
import type { StyleProp } from 'react-native';
import type { BracketTheme } from './theme';

/** Built-in strings, replaceable for translation. */
export interface Labels {
  /** Shown in place of a participant when there is no opponent. */
  bye: string;
  /** Shown while a slot is still to be decided. */
  tbd: string;
}

/** A style, or a function of the part's state that returns one. */
export type StyleOf<State, Style> = StyleProp<Style> | ((state: State) => StyleProp<Style>);

export function resolveStyle<State, Style>(
  style: StyleOf<State, Style> | undefined,
  state: State,
): StyleProp<Style> {
  return typeof style === 'function'
    ? (style as (state: State) => StyleProp<Style>)(state)
    : (style as StyleProp<Style>);
}

export interface BracketContextValue {
  stage: Stage;
  group: Group;
  participants: Map<Id, Participant>;
  theme: BracketTheme;
  labels: Labels;
  /** The participant whose path is highlighted. */
  highlighted: Id | null;
  /** Highlights a participant's path, or clears it with `null`. */
  highlight: (participantId: Id | null) => void;
  /** Set when matches can be pressed; participants then leave presses to the match. */
  onMatchPress?: (match: Match) => void;
  renderRoundTitle?: (round: Round) => ReactNode;
}

export const BracketContext: Context<BracketContextValue | null> =
  createContext<BracketContextValue | null>(null);

/** Everything a part needs from the bracket around it. */
export function useBracket(): BracketContextValue {
  const value = useContext(BracketContext);
  if (!value) throw new Error('Bracket parts must be rendered inside a <Bracket>.');
  return value;
}

export const MatchContext: Context<Match | null> = createContext<Match | null>(null);

/** The match being rendered, inside `renderMatch`. */
export function useMatch(): Match {
  const match = useContext(MatchContext);
  if (!match)
    throw new Error('Bracket.Match and Bracket.Participant must be rendered for a match.');
  return match;
}
