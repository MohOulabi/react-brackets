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
import { flushSync } from 'react-dom';
import { type ClassNameProp, cx, flag, useBracketContext, usePart } from './context';
import { type Flight, FRAME_EVENT, flights, still } from './hooks/use-flip';
import { useIsomorphicLayoutEffect } from './hooks/use-isomorphic-layout-effect';
import { anchors, type Box, boxWithin, connectorPath, type Point } from './paths';

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
  /** Below 1 while one of its cards is fading in. */
  opacity: number;
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
    const element = svg.current;
    const content = element?.parentElement;
    if (!grid || !element || !content) return;

    // Cards in motion are drawn away from their layout; `flights` says where, and is empty once they land.
    const measure = () => {
      const measured: MeasuredEdge[] = [];
      for (const edge of layout.edges) {
        const fromCell = cells.get(edge.from);
        const toCell = cells.get(edge.to);
        const from = anchorOf(fromCell);
        const to = anchorOf(toCell);
        if (!from || !to) continue;
        const a = inFlight(fromCell);
        const b = inFlight(toCell);
        const [start, end] = anchors(
          shifted(boxWithin(from, content), a),
          shifted(boxWithin(to, content), b),
        );
        const opacity = Math.min(a.opacity, b.opacity);
        measured.push({ ...edge, start, end, opacity, d: connectorPath(start, end, radius) });
      }
      setEdges(measured);
    };

    let moving = false;
    // The cards' clock calls this right after placing them, so each frame's lines use the same numbers.
    const follow = (event: Event) => {
      const { done, sync } = (event as CustomEvent<{ done?: boolean; sync?: boolean }>).detail;
      moving = !done;
      // Inside React's commit the update is already synchronous; in a frame it has to be forced.
      if (done || sync) measure();
      else flushSync(measure);
    };
    element.addEventListener(FRAME_EVENT, follow);

    measure();
    // Mid-flight, a resize would snap the lines to where the cards are going, not where they are.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => moving || measure());
    observer?.observe(content);
    for (const cell of cells.values()) observer?.observe(cell);
    return () => {
      element.removeEventListener(FRAME_EVENT, follow);
      observer?.disconnect();
    };
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
          <g key={`${edge.from}-${edge.to}`} opacity={edge.opacity < 1 ? edge.opacity : undefined}>
            <ConnectorContext.Provider value={connector}>
              {children(connector)}
            </ConnectorContext.Provider>
          </g>
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

function inFlight(cell: HTMLElement | undefined): Flight {
  return (cell && flights.get(cell)) || still;
}

function shifted(box: Box, flight: Flight): Box {
  return { ...box, left: box.left + flight.x, top: box.top + flight.y };
}

function anchorOf(cell: HTMLElement | undefined): HTMLElement | undefined {
  const card = cell?.firstElementChild;
  return card instanceof HTMLElement ? card : cell;
}
