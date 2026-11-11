import type { Id } from '@react-brackets/core';
import { type ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import { type PaginationState, usePagination, useRoot, useZoom, type ZoomState } from './context';
import { NextPage, PageButton, PageIndicator, Pagination, PreviousPage } from './pagination';
import { MatchPart, ParticipantPart, RoundTitle } from './parts';
import { GroupTitle, groupSections, Root, type RootProps } from './root';
import { Viewport, type ViewportProps } from './viewport';
import { ZoomControls, ZoomIn, ZoomLevel, ZoomOut, ZoomReset } from './zoom-controls';

export type { BracketLayout } from './viewport';

export interface BracketProps
  extends Omit<RootProps, 'children' | 'group'>,
    Omit<ViewportProps, 'controls'> {
  /**
   * The largest zoom in `pan-zoom` mode. The same as `zoom.maxScale`.
   * @defaultValue 2
   */
  maxScale?: number;
  /** Draws your own round tabs under the paged view, in place of the default ones. */
  renderPagination?: (pagination: PaginationState) => ReactNode;
  /** Draws your own zoom controls over the pan-zoom frame, in place of the default ones. */
  renderZoomControls?: (zoom: ZoomState) => ReactNode;
}

/**
 * Draws every group of a stage: one round at a time on narrow screens, swiped
 * on the UI thread, and the whole tree on wide ones.
 */
function DefaultBracket(props: BracketProps): ReactNode {
  const { stage, style } = props;
  const sections = useMemo(() => groupSections(stage), [stage]);
  if (sections.length === 1 && sections[0]) {
    return <GroupBracket {...props} group={sections[0].group.id} style={style} />;
  }
  return (
    <View style={[{ gap: 28 }, style]}>
      {sections.map(({ group }) => (
        <GroupBracket key={group.id} {...props} group={group.id} style={undefined} />
      ))}
    </View>
  );
}

function GroupBracket({
  layout,
  compact,
  pageHeight,
  mode,
  maxSwipeRounds,
  maxScale,
  zoom,
  renderPagination,
  renderZoomControls,
  ...root
}: BracketProps & { group: Id }): ReactNode {
  return (
    <Root
      {...root}
      zoom={maxScale === undefined ? zoom : { ...zoom, maxScale: zoom?.maxScale ?? maxScale }}
    >
      <GroupTitle />
      <Viewport
        layout={layout}
        compact={compact}
        pageHeight={pageHeight}
        mode={mode}
        maxSwipeRounds={maxSwipeRounds}
        controls={renderZoomControls ? <OwnZoomControls render={renderZoomControls} /> : true}
      />
      {renderPagination ? <OwnPagination render={renderPagination} /> : <Pagination />}
    </Root>
  );
}

function OwnPagination({ render }: { render: (pagination: PaginationState) => ReactNode }) {
  const pagination = usePagination();
  const { paged } = useRoot('Pagination');
  return paged ? render(pagination) : null;
}

function OwnZoomControls({ render }: { render: (zoom: ZoomState) => ReactNode }) {
  const zoom = useZoom();
  return zoom ? render(zoom) : null;
}

type BracketComponent = typeof DefaultBracket & {
  Match: typeof MatchPart;
  Participant: typeof ParticipantPart;
  RoundTitle: typeof RoundTitle;
  Root: typeof Root;
  Viewport: typeof Viewport;
  GroupTitle: typeof GroupTitle;
  Pagination: typeof Pagination;
  PageButton: typeof PageButton;
  PreviousPage: typeof PreviousPage;
  NextPage: typeof NextPage;
  PageIndicator: typeof PageIndicator;
  ZoomControls: typeof ZoomControls;
  ZoomIn: typeof ZoomIn;
  ZoomLevel: typeof ZoomLevel;
  ZoomOut: typeof ZoomOut;
  ZoomReset: typeof ZoomReset;
};

/**
 * Tournament brackets for React Native. `<Bracket stage={stage} />` draws the
 * whole stage; `renderMatch` with `Bracket.Match` and `Bracket.Participant`
 * restyles or replaces the cards. `Bracket.Root` and the parts inside it arrange
 * the viewport, round tabs and zoom controls your own way.
 */
export const Bracket: BracketComponent = Object.assign(DefaultBracket, {
  Match: MatchPart,
  Participant: ParticipantPart,
  RoundTitle,
  Root,
  Viewport,
  GroupTitle,
  Pagination,
  PageButton,
  PreviousPage,
  NextPage,
  PageIndicator,
  ZoomControls,
  ZoomIn,
  ZoomLevel,
  ZoomOut,
  ZoomReset,
});
