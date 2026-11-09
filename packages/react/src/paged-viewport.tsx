import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useRef,
  useState,
} from 'react';
import { type Motion, useBracketContext } from './context';
import { useFlip } from './hooks/use-flip';
import { useIsomorphicLayoutEffect } from './hooks/use-isomorphic-layout-effect';
import { rubberBand, useSwipe } from './hooks/use-swipe';
import { GridContent } from './viewport';

type SectionProps = ComponentPropsWithoutRef<'section'>;

/** Share of the width given to the round in focus; the rest previews the next round. */
const FOCUS = 0.76;
const ROUNDS = ':scope > [data-part="round"]';

/**
 * One round at a time, still drawn as a bracket: the round in focus stacks
 * tightly, the next one peeks in with its connectors, and swiping glides every
 * match into its new place.
 */
export function PagedBracketViewport({ style, children, ...props }: SectionProps): ReactNode {
  const { page, setPage, rounds, width, labels, motion } = useBracketContext();
  const viewport = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const { rtl, height } = useFrame(viewport, content, page);
  const step = rtl ? -1 : 1;
  const { offset, dragging, handlers } = useSwipe({
    onSwipe: (direction) => setPage(page + direction * step),
  });
  useFlip(viewport, dragging ? null : motion);
  const drag = resist(offset, step, page, rounds.length, width ?? 0);

  return (
    <section
      {...props}
      {...handlers}
      ref={viewport}
      aria-roledescription="carousel"
      aria-label={labels.rounds}
      onKeyDown={useArrowKeys(page, setPage, step)}
      style={{
        overflow: 'hidden',
        touchAction: 'pan-y',
        userSelect: 'none',
        height,
        transition: transition('height', dragging ? null : motion),
        ...style,
      }}
    >
      <GridContent
        contentRef={content}
        columnWidth={Math.round((width ?? 320) * FOCUS)}
        style={{ transform: drag ? `translateX(${drag}px)` : undefined }}
      >
        {children}
      </GridContent>
    </section>
  );
}

/** One round at a time as a plain list of matches, sliding sideways between rounds. */
export function PagedListViewport({ style, children, ...props }: SectionProps): ReactNode {
  const { page, setPage, rounds, classNames, labels, width, motion } = useBracketContext();
  const viewport = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const { rtl, height } = useFrame(viewport, content, page, ROUNDS);
  const step = rtl ? -1 : 1;
  const { offset, dragging, handlers } = useSwipe({
    onSwipe: (direction) => setPage(page + direction * step),
  });
  const timing = dragging ? null : motion;
  const drag = resist(offset, step, page, rounds.length, width ?? 0);

  return (
    <section
      {...props}
      {...handlers}
      ref={viewport}
      aria-roledescription="carousel"
      aria-label={labels.rounds}
      onKeyDown={useArrowKeys(page, setPage, step)}
      style={{
        overflow: 'hidden',
        touchAction: 'pan-y',
        userSelect: 'none',
        height,
        transition: transition('height', timing),
        ...style,
      }}
    >
      <div
        ref={content}
        data-scope="bracket"
        data-part="content"
        className={classNames.content}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          transform: `translateX(calc(${-page * step * 100}% + ${drag}px))`,
          transition: transition('transform', timing),
        }}
      >
        {children}
      </div>
    </section>
  );
}

/** Follows the finger, but resists once there is no round left to reveal. */
function resist(offset: number, step: number, page: number, pages: number, width: number): number {
  const pull = offset * step;
  const pastEdge = (pull > 0 && page === 0) || (pull < 0 && page === pages - 1);
  return pastEdge ? rubberBand(offset, width) : offset;
}

function transition(property: string, motion: Motion | null): string | undefined {
  return motion ? `${property} ${motion.duration}ms ${motion.easing}` : undefined;
}

/** Reads the text direction and follows the height of the content, or of the round on `page`. */
function useFrame(
  viewport: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
  page: number,
  roundSelector?: string,
): { rtl: boolean; height: number | undefined } {
  const [rtl, setRtl] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const { columns } = useBracketContext();

  useIsomorphicLayoutEffect(() => {
    if (viewport.current) setRtl(getComputedStyle(viewport.current).direction === 'rtl');
    const target = roundSelector
      ? content.current?.querySelectorAll(roundSelector)[page]
      : content.current;
    if (!(target instanceof HTMLElement)) return;
    setHeight(target.offsetHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setHeight(target.offsetHeight));
    observer.observe(target);
    return () => observer.disconnect();
  }, [page, columns, roundSelector]);

  return { rtl, height };
}

function useArrowKeys(
  page: number,
  setPage: (page: number) => void,
  step: number,
): (event: KeyboardEvent<HTMLElement>) => void {
  return (event) => {
    if (event.key === 'ArrowRight') setPage(page + step);
    else if (event.key === 'ArrowLeft') setPage(page - step);
    else return;
    event.preventDefault();
  };
}
