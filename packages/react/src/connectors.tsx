import type { Id, LayoutEdge, Match } from '@react-brackets/core';
import { type ComponentPropsWithoutRef, type ReactNode, useMemo, useRef, useState } from 'react';
import { cx, flag, useBracketContext } from './context';
import { useIsomorphicLayoutEffect } from './hooks/use-isomorphic-layout-effect';
import { anchors, boxWithin, connectorPath } from './paths';

/** The props `Bracket.Connectors` adds on top of a regular `svg`. */
export interface ConnectorsOwnProps {
  /**
   * Rounds the corners of each line, in pixels.
   * @defaultValue 0
   */
  radius?: number;
}

/** Every `ConnectorsOwnProps` prop, plus any prop of an `svg`, except children. */
export interface ConnectorsProps
  extends ConnectorsOwnProps,
    Omit<ComponentPropsWithoutRef<'svg'>, keyof ConnectorsOwnProps | 'children'> {}

interface MeasuredEdge extends LayoutEdge {
  d: string;
}

/** The lines between matches, drawn as one SVG measured from the real match cards. */
export function Connectors({ radius = 0, className, style, ...props }: ConnectorsProps): ReactNode {
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
        measured.push({ ...edge, d: connectorPath(start, end, radius) });
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
      {edges.map((edge) => {
        const from = matches.get(edge.from);
        const to = matches.get(edge.to);
        if (hideByes && from?.slots.some((slot) => slot.bye)) return null;
        const advanced =
          highlighted !== null &&
          from?.winner != null &&
          from.slots[from.winner].participantId === highlighted &&
          to?.slots[edge.slot].participantId === highlighted;
        return (
          <path
            key={`${edge.from}-${edge.to}`}
            d={edge.d}
            fill="none"
            stroke="currentColor"
            data-scope="bracket"
            data-part="connector"
            data-highlighted={flag(advanced)}
            data-bye={flag(from?.slots.some((slot) => slot.bye))}
            data-status={from?.status}
            className={classNames.connector}
          />
        );
      })}
    </svg>
  );
}

function anchorOf(cell: HTMLElement | undefined): HTMLElement | undefined {
  const card = cell?.firstElementChild;
  return card instanceof HTMLElement ? card : cell;
}
