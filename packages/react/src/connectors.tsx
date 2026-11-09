import type { Id, LayoutEdge, Match, MatchStatus, SlotIndex } from '@react-brackets/core';
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type ClassNameProp, cx, flag, useBracketContext, usePart } from './context';
import { useIsomorphicLayoutEffect } from './hooks/use-isomorphic-layout-effect';
import { anchors, boxWithin, connectorPath, type Point } from './paths';

/** One line between two matches. Passed to `Bracket.Connectors` children and to `className` functions. */
export interface ConnectorState {
  /** SVG path data of the default line: an elbow from `start` to `end`, rounded by `radius`. */
  d: string;
  /** Where the line leaves the feeding match, in the bracket's own pixels. */
  start: Point;
  /** Where the line enters the next match. */
  end: Point;
  /** The match the line comes from. */
  from: Match;
  /** The match the line leads to. */
  to: Match;
  /** Which participant slot of `to` the line feeds. */
  slot: SlotIndex;
  /** The status of `from`. */
  status: MatchStatus;
  /** `true` when `from` has a bye. */
  bye: boolean;
  /** `true` while the line is part of the highlighted participant's path. */
  highlighted: boolean;
}

const ConnectorContext = createContext<ConnectorState | null>(null);

/** The line `Bracket.Connector` is rendering. Use it to build a line from scratch. */
export function useConnector(): ConnectorState {
  const connector = useContext(ConnectorContext);
  if (!connector) throw new Error('Bracket.Connector must be used inside Bracket.Connectors.');
  return connector;
}

/** The props `Bracket.Connectors` adds on top of a regular `svg`. */
export interface ConnectorsOwnProps {
  /**
   * Rounds the corners of each line, in pixels.
   * @defaultValue 0
   */
  radius?: number;
  /** SVG definitions your lines refer to, such as arrowhead markers or gradients. Rendered inside `<defs>`. */
  defs?: ReactNode;
  /**
   * Renders one line. Called for every line between two matches.
   * @defaultValue a `Bracket.Connector`
   */
  children?: (connector: ConnectorState) => ReactNode;
}

/** Every `ConnectorsOwnProps` prop, plus any prop of an `svg`. */
export interface ConnectorsProps
  extends ConnectorsOwnProps,
    Omit<ComponentPropsWithoutRef<'svg'>, keyof ConnectorsOwnProps> {}

interface MeasuredEdge extends LayoutEdge {
  d: string;
  start: Point;
  end: Point;
}

/** The lines between matches, drawn as one SVG measured from the real match cards. */
export function Connectors({
  radius = 0,
  defs,
  children = defaultConnector,
  className,
  style,
  ...props
}: ConnectorsProps): ReactNode {
  const { grid, layout, cells, highlighted, classNames, hideByes } = useBracketContext();
  const svg = useRef<SVGSVGElement>(null);
  const [edges, setEdges] = useState<MeasuredEdge[]>([]);

  const matches = useMemo(() => {
    const byId = new Map<Id, Match>();
    for (const column of layout.columns) {
      for (const cell of column.cells) byId.set(cell.match.id, cell.match);
    }
    return byId;
  }, [layout]);

  useIsomorphicLayoutEffect(() => {
    const content = svg.current?.parentElement;
    if (!grid || !content) return;

    const measure = () => {
      const measured: MeasuredEdge[] = [];
      for (const edge of layout.edges) {
        const from = anchorOf(cells.get(edge.from));
        const to = anchorOf(cells.get(edge.to));
        if (!from || !to) continue;
        const [start, end] = anchors(boxWithin(from, content), boxWithin(to, content));
        measured.push({ ...edge, start, end, d: connectorPath(start, end, radius) });
      }
      setEdges(measured);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    for (const cell of cells.values()) observer.observe(cell);
    return () => observer.disconnect();
  }, [grid, layout, cells, radius]);

  if (!grid) return null;

  return (
    <svg
      {...props}
      ref={svg}
      aria-hidden
      data-scope="bracket"
      data-part="connectors"
      className={cx(classNames.connectors, className)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {defs && <defs>{defs}</defs>}
      {edges.map((edge) => {
        const from = matches.get(edge.from);
        const to = matches.get(edge.to);
        if (!from || !to) return null;
        const bye = from.slots.some((slot) => slot.bye);
        if (hideByes && bye) return null;

        const connector: ConnectorState = {
          d: edge.d,
          start: edge.start,
          end: edge.end,
          from,
          to,
          slot: edge.slot,
          status: from.status,
          bye,
          highlighted:
            highlighted !== null &&
            from.winner !== null &&
            from.slots[from.winner].participantId === highlighted &&
            to.slots[edge.slot].participantId === highlighted,
        };
        return (
          <ConnectorContext.Provider key={`${edge.from}-${edge.to}`} value={connector}>
            {children(connector)}
          </ConnectorContext.Provider>
        );
      })}
    </svg>
  );
}

function defaultConnector(): ReactNode {
  return <ConnectorPart />;
}

/** Props of `Bracket.Connector`: any prop of an SVG `path`, and a `className` that can be a function of its state. */
export interface ConnectorProps extends Omit<ComponentPropsWithoutRef<'path'>, 'className'> {
  className?: ClassNameProp<ConnectorState>;
}

/**
 * One line, with its `data-*` hooks and theme styling. Use it inside `Bracket.Connectors`
 * and pass any SVG attribute: `strokeDasharray`, `markerEnd`, or your own `d`.
 */
export function ConnectorPart({ className, ...props }: ConnectorProps): ReactNode {
  const connector = useConnector();
  const part = usePart('connector', className, connector);
  return (
    <path
      fill="none"
      stroke="currentColor"
      d={connector.d}
      {...props}
      {...part}
      data-highlighted={flag(connector.highlighted)}
      data-bye={flag(connector.bye)}
      data-status={connector.status}
    />
  );
}

function anchorOf(cell: HTMLElement | undefined): HTMLElement | undefined {
  const card = cell?.firstElementChild;
  return card instanceof HTMLElement ? card : cell;
}
