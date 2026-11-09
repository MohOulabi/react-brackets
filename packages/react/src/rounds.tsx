import type {
  ColumnSide,
  Group,
  Match as MatchData,
  Round as RoundData,
} from '@react-brackets/core';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import {
  CellContext,
  type ClassNameProp,
  type Column,
  ColumnContext,
  flag,
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
  return columns.map((column, index) => (
    <ColumnContext.Provider key={column.key} value={{ column, index }}>
      {children(column, index)}
    </ColumnContext.Provider>
  ));
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
  const { round, side, current, hidden } = column;
  const part = usePart('round', className, { round, side, current });

  const layout: CSSProperties = grid
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
  return (
    <h3
      {...props}
      {...part}
      data-round={column.round.id}
      style={{ margin: 0, ...(grid && { gridRow: 1 }), ...style }}
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

  return (
    <ol
      {...props}
      {...part}
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        ...(grid && { gridRow: '2 / -1', display: 'grid', gridTemplateRows: 'subgrid' }),
        ...style,
      }}
    >
      {column.cells.map((cell) => (
        <li
          key={cell.match.id}
          ref={(element) => {
            if (element) cells.set(cell.match.id, element);
            else cells.delete(cell.match.id);
          }}
          data-scope="bracket"
          data-part="cell"
          data-match={cell.match.id}
          data-status={cell.match.status}
          className={classNames.cell}
          hidden={hideByes && cell.match.slots.some((slot) => slot.bye)}
          style={
            grid
              ? {
                  gridRow: `${cell.row + 1} / span ${cell.span}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }
              : undefined
          }
        >
          <CellContext.Provider value={cell}>{children(cell.match)}</CellContext.Provider>
        </li>
      ))}
    </ol>
  );
}

function defaultMatch(): ReactNode {
  return (
    <MatchPart>
      <ParticipantPart slot={0} />
      <ParticipantPart slot={1} />
    </MatchPart>
  );
}
