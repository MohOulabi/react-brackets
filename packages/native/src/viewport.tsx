import { type Group, type Id, layoutGroup } from '@react-brackets/core';
import { type ReactNode, useMemo } from 'react';
import { useBracket, useRoot } from './context';
import type { Metrics, PageHeight } from './geometry';
import { edgeKey, PagedBracket } from './paged';
import { TreeBracket, type TreeMode } from './tree';

/** `standard` flows one way; `mirrored` splits the bracket into halves that meet at the final. */
export type BracketLayout = 'standard' | 'mirrored';

export interface ViewportProps {
  /** `mirrored` splits the bracket into two halves that meet at the final. Applies to the full tree. */
  layout?: BracketLayout;
  /**
   * How the paged view draws a round: `bracket` keeps the lines with the next
   * round peeking in; `list` shows each round as a plain list of matches.
   * @defaultValue 'bracket'
   */
  compact?: 'bracket' | 'list';
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
  /**
   * The most rounds one swipe can move. `1` pages one round at a time.
   * @defaultValue Infinity
   */
  maxSwipeRounds?: number;
  /**
   * The zoom controls drawn in the pan-zoom frame: the default ones, your own, or `false`
   * for none, when you place `Bracket.ZoomControls` or your own buttons elsewhere.
   * @defaultValue true
   */
  controls?: boolean | ReactNode;
}

/**
 * The bracket itself: one round at a time on narrow screens, swiped on the UI
 * thread, and the whole tree on wide ones.
 */
export function Viewport({
  layout = 'standard',
  compact = 'bracket',
  pageHeight = 'contain',
  mode = 'scroll',
  maxSwipeRounds = Number.POSITIVE_INFINITY,
  controls = true,
}: ViewportProps): ReactNode {
  const { group, width, paged, dir, setPage, position, duration, swipe, cards, drawMatch } =
    useRoot('Viewport');
  const { theme, highlighted } = useBracket();
  const tree = useMemo(
    () => layoutGroup(group, { mirror: !paged && layout === 'mirrored' }),
    [group, layout, paged],
  );
  const highlightedEdges = useMemo(
    () => litEdges(group, tree.edges, highlighted),
    [group, tree, highlighted],
  );

  if (width === 0) return null;
  if (paged) {
    return (
      <PagedBracket
        group={group}
        width={width}
        matchHeight={cards.base}
        heights={cards.heights}
        theme={theme}
        onPage={setPage}
        position={position}
        swipe={swipe}
        maxSwipeRounds={Math.max(1, maxSwipeRounds)}
        duration={duration}
        highlightedEdges={highlightedEdges}
        renderMatch={drawMatch}
        variant={compact}
        rtl={dir === 'rtl'}
        fit={pageHeight}
      />
    );
  }
  const metrics: Metrics = {
    matchWidth: theme.matchWidth,
    matchHeight: cards.base,
    heights: cards.heights,
    matchGap: theme.matchGap,
    columnGap: theme.columnGap,
    titleHeight: theme.titleHeight,
  };
  return (
    <TreeBracket
      layout={tree}
      metrics={metrics}
      width={width}
      mode={mode}
      theme={theme}
      highlightedEdges={highlightedEdges}
      renderMatch={drawMatch}
      rtl={dir === 'rtl'}
      controls={controls}
    />
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
