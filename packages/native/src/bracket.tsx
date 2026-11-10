import {
  type Group,
  type GroupKind,
  type Id,
  layoutGroup,
  type Match,
  participantMap,
  type Round,
  type Stage,
} from '@react-brackets/core';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  type LayoutChangeEvent,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { BracketContext, type BracketContextValue, type Labels, MatchContext } from './context';
import type { Metrics, PageHeight } from './geometry';
import { edgeKey, PagedBracket } from './paged';
import { MatchPart, ParticipantPart, RoundTitle } from './parts';
import { type BracketTheme, type ThemeOverrides, useBracketTheme } from './theme';
import { TreeBracket, type TreeMode } from './tree';

/** `standard` flows one way; `mirrored` splits the bracket into halves that meet at the final. */
export type BracketLayout = 'standard' | 'mirrored';

export interface BracketProps {
  /** The stage to draw. Build one with a format function, `fromRounds`, or load a saved one. */
  stage: Stage;
  /** `mirrored` splits the bracket into two halves that meet at the final. Applies to the full tree. */
  layout?: BracketLayout;
  /**
   * Below this width, in points, the bracket pages through one round at a time.
   * It is the bracket's own width, not the screen's. `0` always shows the whole tree.
   * @defaultValue 600
   */
  compactBelow?: number;
  /**
   * How the paged view draws a round: `bracket` keeps the lines with the next
   * round peeking in; `list` shows each round as a plain list of matches.
   * @defaultValue 'bracket'
   */
  compact?: 'bracket' | 'list';
  /**
   * Which way the rounds read. Right to left puts the first round on the right and swipes the other way.
   * @defaultValue the app's own direction
   */
  dir?: 'ltr' | 'rtl';
  /**
   * How the paged view's height moves between rounds of different heights.
   * `contain` holds both rounds while they move and settles once the swipe lands, so nothing is cut;
   * `follow` blends the heights under the finger, cutting the taller round as it moves.
   * @defaultValue 'contain'
   */
  pageHeight?: PageHeight;
  /**
   * How the whole tree fits its width.
   * @defaultValue 'scroll'
   */
  mode?: TreeMode;
  /** The round in focus in the paged view, counting from 0. Set it to control paging yourself. */
  page?: number;
  /** Called with the new round once a swipe lands, or a round is chosen. */
  onPageChange?: (page: number) => void;
  /**
   * The most rounds one swipe can move. `1` pages one round at a time.
   * @defaultValue Infinity
   */
  maxSwipeRounds?: number;
  /** The participant whose path is highlighted. Set it to control highlighting yourself; `null` clears it. */
  highlighted?: Id | null;
  /** Called when a participant is pressed to highlight their path, or pressed again to clear it. */
  onHighlightChange?: (participantId: Id | null) => void;
  /** Makes every match pressable. Participants then no longer highlight on press. */
  onMatchPress?: (match: Match) => void;
  /** Draws one match. Build it from `Bracket.Match` and `Bracket.Participant`, or anything else. */
  renderMatch?: (match: Match) => ReactNode;
  /** Draws a round's title. */
  renderRoundTitle?: (round: Round) => ReactNode;
  /** Replaces any of the theme's values, over the light or dark theme or the nearest provider. */
  theme?: ThemeOverrides;
  /**
   * Animation length in milliseconds, or `false` to turn animation off. Off anyway
   * for people who prefer reduced motion.
   * @defaultValue 320
   */
  motion?: number | false;
  /**
   * The largest zoom in `pan-zoom` mode.
   * @defaultValue 2
   */
  maxScale?: number;
  /** Replaces any of the built-in strings, for translation. */
  labels?: Partial<Labels>;
  style?: StyleProp<ViewStyle>;
}

const defaultLabels: Labels = { bye: 'Bye', tbd: 'TBD' };

/** Groups that get a title when a stage has several. */
const titled: GroupKind[] = ['winners', 'losers', 'pool'];

/**
 * Draws every group of a stage: one round at a time on narrow screens, swiped
 * on the UI thread, and the whole tree on wide ones.
 */
function DefaultBracket(props: BracketProps): ReactNode {
  const { stage, style } = props;
  const sections = useMemo(() => groupSections(stage), [stage]);
  if (sections.length === 1 && sections[0]) {
    return <GroupBracket {...props} group={sections[0].group} style={style} />;
  }
  return (
    <View style={[{ gap: 28 }, style]}>
      {sections.map(({ group, title }) => (
        <GroupBracket key={group.id} {...props} group={group} title={title} style={undefined} />
      ))}
    </View>
  );
}

interface Section {
  group: Group;
  title: string | null;
}

/** The grand final continues the winners bracket on the same grid. */
function groupSections(stage: Stage): Section[] {
  const final = stage.groups.find((group) => group.kind === 'grand-final');
  const winners = stage.groups.find((group) => group.kind === 'winners');
  return stage.groups
    .filter((group) => !(final && winners && group === final))
    .map((group) => ({
      group:
        final && winners && group === winners
          ? { ...group, rounds: [...group.rounds, ...final.rounds] }
          : group,
      title: stage.groups.length > 1 && titled.includes(group.kind) ? group.name : null,
    }));
}

function GroupBracket({
  stage,
  group,
  title,
  layout = 'standard',
  compactBelow = 600,
  compact = 'bracket',
  dir = I18nManager.isRTL ? 'rtl' : 'ltr',
  pageHeight = 'contain',
  mode = 'scroll',
  page: controlledPage,
  onPageChange,
  maxSwipeRounds = Number.POSITIVE_INFINITY,
  highlighted: controlledHighlight,
  onHighlightChange,
  onMatchPress,
  renderMatch,
  renderRoundTitle,
  theme: overrides,
  motion = 320,
  maxScale = 2,
  labels,
  style,
}: BracketProps & { group: Group; title?: string | null }): ReactNode {
  const theme = useBracketTheme(overrides);
  const reducedMotion = useReducedMotion();
  const duration = motion === false || reducedMotion ? null : motion;
  const [width, setWidth] = useState(0);
  const [ownPage, setOwnPage] = useState(0);
  const [ownHighlight, setOwnHighlight] = useState<Id | null>(null);
  const page = Math.min(controlledPage ?? ownPage, group.rounds.length - 1);
  const highlighted = controlledHighlight === undefined ? ownHighlight : controlledHighlight;
  const participants = useMemo(() => participantMap(stage), [stage]);
  const matchHeight = useMatchHeight(theme);

  const setPage = useCallback(
    (next: number) => {
      setOwnPage(next);
      onPageChange?.(next);
    },
    [onPageChange],
  );
  const highlight = useCallback(
    (participantId: Id | null) => {
      setOwnHighlight(participantId);
      onHighlightChange?.(participantId);
    },
    [onHighlightChange],
  );

  const paged = width > 0 && width < compactBelow;
  const tree = useMemo(
    () => layoutGroup(group, { mirror: !paged && layout === 'mirrored' }),
    [group, layout, paged],
  );
  const highlightedEdges = useMemo(
    () => litEdges(group, tree.edges, highlighted),
    [group, tree, highlighted],
  );

  const context = useMemo<BracketContextValue>(
    () => ({
      stage,
      group,
      participants,
      theme,
      labels: { ...defaultLabels, ...labels },
      highlighted,
      highlight,
      onMatchPress,
      renderRoundTitle,
    }),
    [
      stage,
      group,
      participants,
      theme,
      labels,
      highlighted,
      highlight,
      onMatchPress,
      renderRoundTitle,
    ],
  );

  const drawMatch = (match: Match) => (
    <MatchContext.Provider value={match}>
      <View onLayout={matchHeight.measure}>
        {onMatchPress ? (
          <PressableMatch match={match} onPress={onMatchPress}>
            {renderMatch ? renderMatch(match) : <MatchPart />}
          </PressableMatch>
        ) : renderMatch ? (
          renderMatch(match)
        ) : (
          <MatchPart />
        )}
      </View>
    </MatchContext.Provider>
  );

  const metrics: Metrics = {
    matchWidth: theme.matchWidth,
    matchHeight: matchHeight.value,
    matchGap: theme.matchGap,
    columnGap: theme.columnGap,
    titleHeight: theme.titleHeight,
  };

  return (
    <BracketContext.Provider value={context}>
      <View
        style={[{ opacity: matchHeight.measured ? 1 : 0, direction: dir }, style]}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      >
        {title && (
          <Text
            accessibilityRole="header"
            style={{
              marginBottom: 12,
              color: theme.colors.text,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSize + 1,
              fontWeight: '600',
            }}
          >
            {title}
          </Text>
        )}
        {width > 0 &&
          (paged ? (
            <PagedBracket
              group={group}
              width={width}
              matchHeight={matchHeight.value}
              theme={theme}
              page={page}
              onPage={setPage}
              maxSwipeRounds={Math.max(1, maxSwipeRounds)}
              duration={duration}
              highlightedEdges={highlightedEdges}
              renderMatch={drawMatch}
              variant={compact}
              rtl={dir === 'rtl'}
              fit={pageHeight}
            />
          ) : (
            <TreeBracket
              layout={tree}
              metrics={metrics}
              width={width}
              mode={mode}
              theme={theme}
              maxScale={maxScale}
              duration={duration}
              highlightedEdges={highlightedEdges}
              renderMatch={drawMatch}
              rtl={dir === 'rtl'}
            />
          ))}
      </View>
    </BracketContext.Provider>
  );
}

/**
 * Cards may be any height, so the tallest one sets the spacing for all. Until
 * the first card reports, the bracket stays hidden at a sensible guess.
 */
function useMatchHeight(theme: BracketTheme) {
  const guess = Math.round(2 * (theme.fontSize * 1.3 + 18) + 3);
  const [value, setValue] = useState(guess);
  const [measured, setMeasured] = useState(false);
  const tallest = useRef(0);
  const measure = useCallback((event: LayoutChangeEvent) => {
    const height = Math.ceil(event.nativeEvent.layout.height);
    if (height <= tallest.current) return;
    tallest.current = height;
    setValue(height);
    setMeasured(true);
  }, []);
  return { value, measured, measure };
}

function PressableMatch({
  match,
  onPress,
  children,
}: {
  match: Match;
  onPress: (match: Match) => void;
  children: ReactNode;
}): ReactNode {
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(match)}>
      {({ pressed }) => <View style={{ opacity: pressed ? 0.7 : 1 }}>{children}</View>}
    </Pressable>
  );
}

/** Lines the highlighted participant travelled: they won the match before and hold the slot after. */
function litEdges(
  group: Group,
  edges: { from: Id; to: Id; slot: 0 | 1 }[],
  highlighted: Id | null,
): Set<string> {
  const lit = new Set<string>();
  if (highlighted === null) return lit;
  const matches = new Map(group.rounds.flatMap((round) => round.matches).map((m) => [m.id, m]));
  for (const edge of edges) {
    const from = matches.get(edge.from);
    const to = matches.get(edge.to);
    if (
      from?.winner != null &&
      from.slots[from.winner].participantId === highlighted &&
      to?.slots[edge.slot].participantId === highlighted
    ) {
      lit.add(edgeKey(edge));
    }
  }
  return lit;
}

type BracketComponent = typeof DefaultBracket & {
  Match: typeof MatchPart;
  Participant: typeof ParticipantPart;
  RoundTitle: typeof RoundTitle;
};

/**
 * Tournament brackets for React Native. `<Bracket stage={stage} />` draws the
 * whole stage; `renderMatch` with `Bracket.Match` and `Bracket.Participant`
 * restyles or replaces the cards.
 */
export const Bracket: BracketComponent = Object.assign(DefaultBracket, {
  Match: MatchPart,
  Participant: ParticipantPart,
  RoundTitle,
});
