import type { GroupKind, Id, Match as MatchData, Stage } from '@react-brackets/core';
import type { ReactNode } from 'react';
import { ConnectorPart, type ConnectorState, Connectors } from './connectors';
import { MatchPart, ParticipantPart } from './match';
import { NextPage, PageButton, PageIndicator, Pagination, PreviousPage } from './pagination';
import { Root, type RootProps } from './root';
import { GroupTitle, Matches, RoundPart, Rounds, RoundTitle } from './rounds';
import { Viewport, type ViewportMode } from './viewport';
import { ZoomControls, ZoomIn, ZoomLevel, ZoomOut, ZoomReset } from './zoom-controls';

/** The props `<Bracket>` adds to `Bracket.Root`'s, which it also takes, except `group` and `children`. */
export interface BracketOwnProps {
  /**
   * Draws your own match card. Wrap it in `Bracket.Match` so connectors,
   * highlighting and clicks keep working.
   */
  renderMatch?: (match: MatchData) => ReactNode;
  /**
   * Rounds the corners of connector lines, in pixels.
   * @defaultValue 0
   */
  connectorRadius?: number;
  /**
   * How the full tree fits its container. See `Bracket.Viewport`.
   * @defaultValue 'scroll'
   */
  mode?: ViewportMode;
  /**
   * Draws your own connector line. Return a `Bracket.Connector` with any SVG
   * attribute, like `strokeDasharray` or `markerEnd`, or any SVG element.
   */
  renderConnector?: (connector: ConnectorState) => ReactNode;
  /** SVG definitions your lines refer to, such as arrowhead markers or gradients. */
  connectorDefs?: ReactNode;
  /**
   * Draws your own round navigation for the paged view, in place of the default one. Build it from
   * `Bracket.Pagination` and its parts, or `usePagination()`.
   */
  renderPagination?: () => ReactNode;
  /**
   * Draws your own zoom controls in `pan-zoom` mode, after the viewport, in place of the default ones in its
   * corner. Build them from `Bracket.ZoomControls` and its parts, or `useZoom()`.
   */
  renderZoomControls?: () => ReactNode;
}

/** Every `BracketOwnProps` prop, plus every `Bracket.Root` prop except `group` and `children`. */
export interface BracketProps extends BracketOwnProps, Omit<RootProps, 'children' | 'group'> {}

const titled: GroupKind[] = ['winners', 'losers', 'pool'];

interface Section {
  ids: Id[];
  titled: boolean;
}

/** Groups drawn together. The grand final continues the winners bracket on the same grid. */
function sections(stage: Stage): Section[] {
  const final = stage.groups.find((group) => group.kind === 'grand-final');
  const winners = stage.groups.find((group) => group.kind === 'winners');
  const merged = final !== undefined && winners !== undefined;

  return stage.groups
    .filter((group) => !(merged && group === final))
    .map((group) => ({
      ids: merged && group === winners ? [group.id, final.id] : [group.id],
      titled: titled.includes(group.kind),
    }));
}

/** Every group of the stage with the default parts. Compose `Bracket.*` parts for full control. */
function DefaultBracket({
  stage,
  renderMatch,
  connectorRadius,
  renderConnector,
  connectorDefs,
  mode,
  renderPagination,
  renderZoomControls,
  ...props
}: BracketProps): ReactNode {
  return sections(stage).map(({ ids, titled }) => (
    <Root {...props} key={ids.join('+')} stage={stage} group={ids}>
      {titled && <GroupTitle />}
      <Viewport mode={mode} controls={!renderZoomControls}>
        <Rounds>
          {() => (
            <RoundPart>
              <RoundTitle />
              <Matches>{renderMatch}</Matches>
            </RoundPart>
          )}
        </Rounds>
        <Connectors radius={connectorRadius} defs={connectorDefs}>
          {renderConnector}
        </Connectors>
      </Viewport>
      {renderZoomControls?.()}
      {renderPagination ? renderPagination() : <Pagination />}
    </Root>
  ));
}

type BracketComponent = typeof DefaultBracket & {
  Root: typeof Root;
  GroupTitle: typeof GroupTitle;
  Viewport: typeof Viewport;
  Rounds: typeof Rounds;
  Round: typeof RoundPart;
  RoundTitle: typeof RoundTitle;
  Matches: typeof Matches;
  Match: typeof MatchPart;
  Participant: typeof ParticipantPart;
  Connectors: typeof Connectors;
  Connector: typeof ConnectorPart;
  Pagination: typeof Pagination;
  PageButton: typeof PageButton;
  PreviousPage: typeof PreviousPage;
  NextPage: typeof NextPage;
  PageIndicator: typeof PageIndicator;
  ZoomControls: typeof ZoomControls;
  ZoomIn: typeof ZoomIn;
  ZoomOut: typeof ZoomOut;
  ZoomReset: typeof ZoomReset;
  ZoomLevel: typeof ZoomLevel;
};

export const Bracket: BracketComponent = Object.assign(DefaultBracket, {
  Root,
  GroupTitle,
  Viewport,
  Rounds,
  Round: RoundPart,
  RoundTitle,
  Matches,
  Match: MatchPart,
  Participant: ParticipantPart,
  Connectors,
  Connector: ConnectorPart,
  Pagination,
  PageButton,
  PreviousPage,
  NextPage,
  PageIndicator,
  ZoomControls,
  ZoomIn,
  ZoomOut,
  ZoomReset,
  ZoomLevel,
});
