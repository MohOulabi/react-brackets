import type {
  ColumnSide,
  Group,
  LayoutCell,
  Match as MatchData,
  Round as RoundData,
} from '@react-brackets/core';
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  memo,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';
import {
  CellContext,
  type ClassNameProp,
  type Column,
  ColumnContext,
  flag,
  type Placed,
  PlacedContext,
  useBracketContext,
  useColumn,
  usePart,
} from './context';
import { MatchPart, ParticipantPart } from './match';

export interface RoundsProps {
  /**
   * Renders one column. Called for every column, left to right.
   * @defaultValue a `Bracket.Round` with its title and matches
   */
  children?: (column: Column, index: number) => ReactNode;
}

/** Renders every column of the current layout, left to right. */
export function Rounds({ children = defaultRound }: RoundsProps): ReactNode {
  const { columns } = useBracketContext();
  // Leaving rounds sit outside the grid, so grid columns count from the first round still in it.
  const firstPlaced = columns.findIndex((column) => !column.leaving);
  return columns.map((column, index) => {
    const placed = column.leaving ? -1 : index - firstPlaced;
    return (
      <ColumnContext.Provider key={column.key} value={{ column, index: placed }}>
        {children(column, placed)}
      </ColumnContext.Provider>
    );
  });
}

function defaultRound(): ReactNode {
  return (
    <RoundPart>
      <RoundTitle />
      <Matches />
    </RoundPart>
  );
}

/** Passed to `className` when it is a function. */
export interface RoundState {
  /** The round in this column. */
  round: RoundData;
  /** Which half of a mirrored layout the column is on. */
  side: ColumnSide;
  /** `true` for the round in focus in the paged view. */
  current: boolean;
}

/** Props of `Bracket.Round`: any prop of a `section`, and a `className` that can be a function of its state. */
export interface RoundProps extends Omit<ComponentPropsWithoutRef<'section'>, 'className'> {
  className?: ClassNameProp<RoundState>;
}

/** One column: a round, or half of one in a mirrored layout. Use it inside `Bracket.Rounds`. */
export function RoundPart({ className, style, ...props }: RoundProps): ReactNode {
  const { grid, labels } = useBracketContext();
  const { column, index } = useColumn();
  const { round, side, current, hidden, leaving } = column;
  const part = usePart('round', className, { round, side, current });

  // A leaving round is laid out from where its parts were last drawn, not from the grid.
  const layout: CSSProperties = leaving
    ? { position: 'absolute', inset: 0, pointerEvents: 'none' }
    : grid
      ? { gridColumn: index + 1, gridRow: '1 / -1', display: 'grid', gridTemplateRows: 'subgrid' }
      : { flex: '0 0 100%', minWidth: 0, boxSizing: 'border-box' };

  return (
    <section
      {...props}
      {...part}
      ref={(element) => {
        if (element) element.inert = hidden;
      }}
      aria-label={round.name || labels.rounds}
      aria-hidden={hidden || undefined}
      data-side={side}
      data-current={flag(current)}
      data-leaving={flag(leaving)}
      style={{ ...layout, ...style }}
    />
  );
}

/** Props of `Bracket.GroupTitle`: any prop of an `h2`. Children replace the group name. */
export interface GroupTitleProps extends Omit<ComponentPropsWithoutRef<'h2'>, 'className'> {
  className?: ClassNameProp<{ group: Group }>;
}

/** The group's name, like `Losers bracket`. */
export function GroupTitle({ className, children, ...props }: GroupTitleProps): ReactNode {
  const { group } = useBracketContext();
  const part = usePart('group-title', className, { group });
  return (
    <h2 {...props} {...part}>
      {children ?? group.name}
    </h2>
  );
}

/** Props of `Bracket.RoundTitle`: any prop of an `h3`. Children replace the round name. */
export interface RoundTitleProps extends Omit<ComponentPropsWithoutRef<'h3'>, 'className'> {
  className?: ClassNameProp<{ round: RoundData }>;
}

/** The round's name, like `Semifinals`. */
export function RoundTitle({ className, style, children, ...props }: RoundTitleProps): ReactNode {
  const { grid } = useBracketContext();
  const { column } = useColumn();
  const part = usePart('round-title', className, { round: column.round });
  const placed = useContext(PlacedContext);
  const at = column.leaving ? placed?.(`round:${column.round.id}`) : undefined;
  return (
    <h3
      {...props}
      {...part}
      data-round={column.round.id}
      style={{ margin: 0, ...(grid && { gridRow: 1 }), ...(at && pinned(at)), ...style }}
    >
      {children ?? column.round.name}
    </h3>
  );
}

/** Props of `Bracket.Matches`: any prop of an `ol`, plus how to render each match. */
export interface MatchesProps
  extends Omit<ComponentPropsWithoutRef<'ol'>, 'className' | 'children'> {
  className?: ClassNameProp<{ round: RoundData }>;
  /**
   * Renders one match. Called for every match in the column, top to bottom.
   * @defaultValue a `Bracket.Match` with both participants
   */
  children?: (match: MatchData) => ReactNode;
}

/** The list of matches in a column, each placed on the shared grid. */
export function Matches({
  className,
  style,
  children = defaultMatch,
  ...props
}: MatchesProps): ReactNode {
  const { grid, cells, classNames, hideByes } = useBracketContext();
  const { column } = useColumn();
  const part = usePart('matches', className, { round: column.round });
  const placed = useContext(PlacedContext);
  const pin = (id: string) => (column.leaving ? placed?.(id) : undefined);

  return (
    <ol
      {...props}
      {...part}
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        ...(grid &&
          !column.leaving && { gridRow: '2 / -1', display: 'grid', gridTemplateRows: 'subgrid' }),
        ...style,
      }}
    >
      {column.cells.map((cell) => (
        <Cell
          key={cell.match.id}
          match={cell.match}
          row={cell.row}
          span={cell.span}
          render={children}
          cells={cells}
          className={classNames.cell}
          hidden={hideByes && cell.match.slots.some((slot) => slot.bye)}
          grid={grid}
          pinned={pin(cell.match.id)}
        />
      ))}
    </ol>
  );
}

interface CellProps extends LayoutCell {
  render: (match: MatchData) => ReactNode;
  cells: Map<string, HTMLElement>;
  className: string | undefined;
  hidden: boolean;
  grid: boolean;
  pinned: Placed | undefined;
}

/**
 * One match's place in the column. Skipped on a render that changes none of its props, so a new result
 * re-renders only the cards whose match changed, as long as `render` keeps its identity.
 */
const Cell = memo(function Cell({
  match,
  row,
  span,
  render,
  cells,
  className,
  hidden,
  grid,
  pinned,
}: CellProps): ReactNode {
  const cell = useMemo(() => ({ match, row, span }), [match, row, span]);
  return (
    <li
      ref={(element) => {
        if (element) cells.set(match.id, element);
        else cells.delete(match.id);
      }}
      data-scope="bracket"
      data-part="cell"
      data-match={match.id}
      data-status={match.status}
      className={className}
      hidden={hidden}
      style={
        grid
          ? {
              gridRow: `${row + 1} / span ${span}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              ...pinnedAt(pinned),
            }
          : undefined
      }
    >
      <CellContext.Provider value={cell}>{render(match)}</CellContext.Provider>
    </li>
  );
});

/** Places a part of a leaving round exactly where it was last drawn. */
function pinned({ x, y, width, height }: Placed): CSSProperties {
  return { position: 'absolute', left: x, top: y, width, height, boxSizing: 'border-box' };
}

function pinnedAt(at: Placed | undefined): CSSProperties | undefined {
  return at && pinned(at);
}

function defaultMatch(): ReactNode {
  return (
    <MatchPart>
      <ParticipantPart slot={0} />
      <ParticipantPart slot={1} />
    </MatchPart>
  );
}
