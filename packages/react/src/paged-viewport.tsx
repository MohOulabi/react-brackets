import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { type Motion, PagingContext, PlacedContext, useBracketContext } from './context';
import { type Run, useFlip } from './hooks/use-flip';
import { useIsomorphicLayoutEffect } from './hooks/use-isomorphic-layout-effect';
import { rubberBand, useSwipe } from './hooks/use-swipe';
import { heightAt, type PageHeight } from './page-height';
import { GridContent } from './viewport';

type SectionProps = ComponentPropsWithoutRef<'section'>;

const ROUNDS = ':scope > [data-part="round"]';

/**
 * One round at a time, still drawn as a bracket: the round in focus stacks
 * tightly, and the next one peeks in with its connectors. A swipe scrubs the
 * change of round under the finger: the next round tightens into focus while the
 * one before slides away, and letting go finishes the move or takes it back.
 */
export function PagedBracketViewport({ style, children, ...props }: SectionProps): ReactNode {
  const { page, setPage, rounds, width, labels, motion, maxSwipeRounds, pageHeight, swipe } =
    useBracketContext();
  const paging = useContext(PagingContext);
  const viewport = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const carry = useRef(0);
  const scrub = useRef(false);
  const heading = useRef<number | null>(null);
  const segment = useRef({ way: 0, rounds: 0 });
  // Where the finger was when the move in progress began: a move restarted mid-drag (a new round ahead, or a
  // re-render) starts from where the cards are drawn, which is where the finger last put them.
  const anchor = useRef({ run: null as Run | null, from: 0, last: 0 });
  const height = useRef({ from: 0, to: 0, rest: 0 });
  const rtl = useRtl(viewport);
  const step = rtl ? -1 : 1;
  const travel = Math.round((width || 320) * swipe.focus);
  const pull = (offset: number) =>
    resist(offset, step, page, rounds.length, width ?? 0, swipe.elasticity);

  // The box follows the move, so it never jumps to the new round's height while cards are still on their way.
  // Heights are the box's own natural height, padding included, so the move lands exactly where layout will.
  const sizes = {
    onBegin() {
      const box = viewport.current;
      if (!box) return;
      const held = box.style.height;
      box.style.height = '';
      const natural = box.offsetHeight;
      box.style.height = held;
      height.current.from = held ? box.offsetHeight : height.current.rest || natural;
      height.current.to = natural;
    },
    onFrame(progress: number) {
      const box = viewport.current;
      if (!box) return;
      if (progress >= 1) {
        box.style.height = '';
        height.current.rest = box.offsetHeight;
        return;
      }
      const { from, to } = height.current;
      if (from > 0) box.style.height = `${heightAt([from, to], progress, pageHeight)}px`;
    },
  };

  const { placed, run } = useFlip(viewport, motion, {
    carry,
    scrub,
    onSettle: () => paging?.settle(),
    ...sizes,
  });

  const { handlers } = useSwipe({
    target: viewport,
    threshold: swipe.commit,
    projection: swipe.projection,
    onDrag: (offset) => {
      // Past a whole round, the move carries on into the next one, never back: rounds already passed stay passed.
      const way = offset < 0 ? step : -step;
      const passed = Math.floor(Math.abs(offset) / travel);
      const steps = Math.min(
        maxSwipeRounds,
        Math.max(1, passed + 1, way === segment.current.way ? segment.current.rounds : 0),
      );
      const to = clamp(page + way * steps, 0, rounds.length - 1);
      const scrubbing = paging && motion && offset !== 0 && to !== page;
      if (!scrubbing) {
        // No round that way: let the bracket stretch, and let any preview go.
        if (heading.current !== null) {
          heading.current = null;
          flushSync(() => paging?.preview(null));
        }
        if (content.current) content.current.style.transform = `translateX(${pull(offset)}px)`;
        return;
      }
      if (heading.current !== to) {
        if (content.current) content.current.style.transform = '';
        segment.current = { way, rounds: Math.abs(to - page) };
        heading.current = to;
        scrub.current = true;
        // Drawn now, so the move exists before the next movement seeks it.
        flushSync(() => paging.preview(to));
      }
      // The cards under the finger move exactly as far as it does.
      const move = run.current;
      if (!move) return;
      if (move !== anchor.current.run)
        anchor.current = { ...anchor.current, run: move, from: anchor.current.last };
      move.seek((Math.abs(offset) - anchor.current.from) / (move.distance || travel));
      anchor.current.last = Math.abs(offset);
    },
    onRelease: (offset, direction, aim) => {
      const to = heading.current;
      heading.current = null;
      scrub.current = false;
      segment.current = { way: 0, rounds: 0 };
      anchor.current = { run: null, from: 0, last: 0 };
      const landing = clamp(
        page + direction * step * Math.min(maxSwipeRounds, pages(offset, aim, travel)),
        0,
        rounds.length - 1,
      );
      if (to === null) {
        // The matches glide on from where the finger left them, not from where the drag began.
        carry.current = pull(offset);
        if (content.current) content.current.style.transform = '';
      }
      if (landing !== page) setPage(landing);
      // The clock carries every card to that round from wherever the finger left it.
      paging?.preview(null);
    },
  });

  return (
    <section
      {...props}
      {...handlers}
      ref={viewport}
      aria-roledescription="carousel"
      aria-label={labels.rounds}
      onKeyDown={useArrowKeys(page, setPage, step)}
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        touchAction: 'pan-y',
        userSelect: 'none',
        ...style,
      }}
    >
      <PlacedContext.Provider value={(key) => placed.current.get(key)}>
        <GridContent contentRef={content} columnWidth={travel}>
          {children}
        </GridContent>
      </PlacedContext.Provider>
    </section>
  );
}

/** Reads the text direction the viewport is laid out in. */
function useRtl(viewport: RefObject<HTMLElement | null>): boolean {
  const [rtl, setRtl] = useState(false);
  useIsomorphicLayoutEffect(() => {
    if (viewport.current) setRtl(getComputedStyle(viewport.current).direction === 'rtl');
  }, []);
  return rtl;
}

/** One round at a time as a plain list of matches, sliding sideways between rounds. */
export function PagedListViewport({ style, children, ...props }: SectionProps): ReactNode {
  const {
    page,
    setPage,
    rounds,
    classNames,
    labels,
    width,
    motion,
    maxSwipeRounds,
    pageHeight,
    swipe,
  } = useBracketContext();
  const viewport = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const rtl = useRtl(viewport);
  const step = rtl ? -1 : 1;
  const follow = useListHeight(viewport, content, page, step, pageHeight);
  const at = -page * step * 100;
  const resting = `translateX(${at}%)`;
  const pull = (offset: number) =>
    resist(offset, step, page, rounds.length, width ?? 0, swipe.elasticity);
  const { dragging, handlers } = useSwipe({
    target: viewport,
    threshold: swipe.commit,
    projection: swipe.projection,
    onDrag: (offset) => {
      if (content.current) {
        content.current.style.transition = 'none';
        content.current.style.transform = `translateX(calc(${at}% + ${pull(offset)}px))`;
      }
      follow();
    },
    onRelease: (offset, direction, aim) => {
      const steps = Math.min(maxSwipeRounds, pages(offset, aim, width || 320));
      if (direction !== 0) setPage(clamp(page + direction * step * steps, 0, rounds.length - 1));
    },
  });

  // React restores the transition and moves to the new round in one commit, so the slide runs from wherever the
  // finger let go. A release that stays on the same round leaves React nothing to change: send it home here.
  useIsomorphicLayoutEffect(() => {
    if (content.current && !dragging) content.current.style.transform = resting;
    follow();
  }, [resting, dragging]);

  return (
    <section
      {...props}
      {...handlers}
      ref={viewport}
      aria-roledescription="carousel"
      aria-label={labels.rounds}
      onKeyDown={useArrowKeys(page, setPage, step)}
      style={{ overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none', ...style }}
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
          transform: resting,
          transition: dragging ? 'none' : transition('transform', motion),
        }}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * How many rounds a swipe pages, like native paging: a flick goes one round past the round under the finger,
 * and a slower release settles on the nearest round. Always at least one: the swipe already decided to page.
 */
function pages(offset: number, aim: number, round: number): number {
  const dragged = Math.abs(offset) / round;
  const flicked = Math.round(Math.abs(aim) / round) > Math.round(dragged);
  return flicked ? Math.floor(dragged) + 1 : Math.max(1, Math.round(dragged));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Follows the finger, but resists once there is no round left to reveal. */
function resist(
  offset: number,
  step: number,
  page: number,
  pages: number,
  width: number,
  elasticity: number,
): number {
  const pull = offset * step;
  const pastEdge = (pull > 0 && page === 0) || (pull < 0 && page === pages - 1);
  return pastEdge ? rubberBand(offset, width, elasticity) : offset;
}

function transition(property: string, motion: Motion | null): string | undefined {
  return motion ? `${property} ${motion.duration}ms ${motion.easing}` : undefined;
}

/**
 * Sizes the list to the rounds on screen. While the list moves, each frame works out where the rounds are
 * from its own transform; at rest, the height follows the round on `page` as it changes size.
 * Returns the function that starts following a move.
 */
function useListHeight(
  viewport: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
  page: number,
  step: number,
  fit: PageHeight,
): () => void {
  const { columns } = useBracketContext();
  const frame = useRef(0);
  const moving = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const box = viewport.current;
    const round = content.current?.querySelectorAll(ROUNDS)[page];
    if (!box || !(round instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (!moving.current) box.style.height = `${round.offsetHeight}px`;
    });
    observer.observe(round);
    return () => observer.disconnect();
  }, [page, columns]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return () => {
    const box = viewport.current;
    const list = content.current;
    if (!box || !list) return;
    cancelAnimationFrame(frame.current);
    const heights = Array.from(
      list.querySelectorAll<HTMLElement>(ROUNDS),
      (round) => round.offsetHeight,
    );
    const tick = () => {
      // Browsers resolve the transform to a matrix; anything else is taken as resting on `page`.
      const transform = getComputedStyle(list).transform;
      const position = transform.startsWith('matrix')
        ? (-new DOMMatrixReadOnly(transform).m41 * step) / (list.offsetWidth || 1)
        : page;
      box.style.height = `${heightAt(heights, position, fit)}px`;
      moving.current = Math.abs(position - page) > 0.001;
      if (moving.current) frame.current = requestAnimationFrame(tick);
    };
    tick();
  };
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
