import type { Round } from '@react-brackets/core';
import { type ComponentPropsWithoutRef, type ReactNode, useContext, useRef, useState } from 'react';
import { type ClassNameProp, flag, PagingContext, useBracketContext, usePart } from './context';
import { useIsomorphicLayoutEffect } from './hooks/use-isomorphic-layout-effect';
import { Icon } from './icons';

/** What `usePagination()` returns: the rounds, where the paged view is, and how to move it. */
export interface PaginationState {
  /** Every round, in order. */
  rounds: Round[];
  /** The round in focus. */
  page: number;
  /** The round being drawn in focus: the page, or the round a swipe in progress is heading to. */
  position: number;
  /** Moves to a round. Out-of-range values are clamped. */
  setPage: (page: number) => void;
  /** Moves one round back. */
  previous: () => void;
  /** Moves one round on. */
  next: () => void;
  /** `false` on the first round. */
  canPrevious: boolean;
  /** `false` on the last round. */
  canNext: boolean;
  /** `true` while the bracket pages through one round at a time; pagination means nothing otherwise. */
  paged: boolean;
}

/** The paged view's rounds and position, and actions to move it: build your own round navigation with it. */
export function usePagination(): PaginationState {
  const { rounds, page, setPage, view } = useBracketContext();
  const paging = useContext(PagingContext);
  const last = rounds.length - 1;
  return {
    rounds,
    page,
    position: paging?.shown ?? page,
    setPage,
    previous: () => setPage(page - 1),
    next: () => setPage(page + 1),
    canPrevious: page > 0,
    canNext: page < last,
    paged: view === 'paged',
  };
}

/** Passed to `Bracket.Pagination`'s `className` when it is a function. */
export interface PaginationPartState {
  page: number;
}

/** Props of `Bracket.Pagination`: any prop of a `nav`. */
export interface PaginationProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'className'> {
  /** A class, or a function of the page. */
  className?: ClassNameProp<PaginationPartState>;
  /** Your own navigation, built from the page parts or `usePagination()`. The default buttons without it. */
  children?: ReactNode;
}

/**
 * Round navigation for the paged view: previous, a button per round, and next by default. Pass children to build
 * your own. Renders nothing while the full tree is shown.
 */
export function Pagination({ className, children, ...props }: PaginationProps): ReactNode {
  const { view, rounds, page, labels } = useBracketContext();
  const part = usePart('pagination', className, { page });
  if (view !== 'paged') return null;

  return (
    <nav {...props} {...part} aria-label={labels.rounds}>
      {children ?? (
        <>
          <PreviousPage />
          {rounds.map((round, index) => (
            <PageButton key={round.id} index={index} />
          ))}
          <NextPage />
        </>
      )}
    </nav>
  );
}

/** Passed to `Bracket.PageButton`'s `className` and `children` when they are functions. */
export interface PageButtonState {
  round: Round;
  index: number;
  /** The round in focus. */
  active: boolean;
}

/** Props of `Bracket.PageButton`: any prop of a `button`. */
export interface PageButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'> {
  /** Which round it moves to, counting from 0. */
  index: number;
  /** A class, or a function of the round and whether it is in focus. */
  className?: ClassNameProp<PageButtonState>;
  /** What the button shows, or a function of the round. The round's name without it. */
  children?: ReactNode | ((state: PageButtonState) => ReactNode);
}

/** A button that moves the paged view to one round. */
export function PageButton({
  index,
  className,
  children,
  onClick,
  ...props
}: PageButtonProps): ReactNode {
  const { rounds, page, setPage } = useBracketContext();
  const round = rounds[index];
  const active = index === page;
  const state = { round, index, active } as PageButtonState;
  const part = usePart('page', className, state);
  if (!round) return null;
  return (
    <button
      type="button"
      aria-current={active ? 'step' : undefined}
      data-active={flag(active)}
      {...props}
      {...part}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setPage(index);
      }}
    >
      {typeof children === 'function' ? children(state) : (children ?? round.name)}
    </button>
  );
}

/** Passed to `Bracket.PreviousPage` and `Bracket.NextPage` when `className` or `children` are functions. */
export interface StepButtonState {
  /** `true` on the first round for previous, and on the last for next. */
  disabled: boolean;
}

/** Props of `Bracket.PreviousPage` and `Bracket.NextPage`: any prop of a `button`. */
export interface StepButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'> {
  /** A class, or a function of whether it is disabled. */
  className?: ClassNameProp<StepButtonState>;
  /** What the button shows, or a function of whether it is disabled. An arrow without it. */
  children?: ReactNode | ((state: StepButtonState) => ReactNode);
}

function StepButton({
  way,
  className,
  children,
  onClick,
  ...props
}: StepButtonProps & { way: 'previous' | 'next' }) {
  const { page, rounds, setPage, labels } = useBracketContext();
  const disabled = way === 'previous' ? page === 0 : page === rounds.length - 1;
  const state = { disabled };
  const part = usePart(way === 'previous' ? 'page-previous' : 'page-next', className, state);
  return (
    <button
      type="button"
      aria-label={labels[way]}
      disabled={disabled}
      {...props}
      {...part}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setPage(page + (way === 'previous' ? -1 : 1));
      }}
    >
      {typeof children === 'function' ? children(state) : (children ?? <Icon name={way} />)}
    </button>
  );
}

/** Moves the paged view one round back. Disabled on the first round. */
export function PreviousPage(props: StepButtonProps): ReactNode {
  return <StepButton {...props} way="previous" />;
}

/** Moves the paged view one round on. Disabled on the last round. */
export function NextPage(props: StepButtonProps): ReactNode {
  return <StepButton {...props} way="next" />;
}

/** Props of `Bracket.PageIndicator`: any prop of a `span`. */
export interface PageIndicatorProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'children'> {
  /** A class, or a function of the round it sits under. */
  className?: ClassNameProp<{ position: number }>;
}

/**
 * A mark that slides under the button of the round being shown, and moves ahead with a swipe. Place it inside
 * `Bracket.Pagination`, next to the `Bracket.PageButton`s it follows.
 */
export function PageIndicator({ className, style, ...props }: PageIndicatorProps): ReactNode {
  const { position } = usePagination();
  const { motion } = useBracketContext();
  const part = usePart('page-indicator', className, { position });
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const nav = ref.current?.parentElement;
    if (!nav) return;
    const measure = () => {
      const button = nav.querySelectorAll<HTMLElement>('[data-part="page"]')[position];
      setBox(button ? { left: button.offsetLeft, width: button.offsetWidth } : null);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [position]);

  return (
    <span
      aria-hidden
      {...props}
      {...part}
      ref={ref}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        // Measured from the same box the buttons are, so it lines up however the navigation is laid out.
        left: 0,
        width: box?.width ?? 0,
        opacity: box ? undefined : 0,
        transform: `translateX(${box?.left ?? 0}px)`,
        transition: motion
          ? `transform ${motion.duration}ms ${motion.easing}, width ${motion.duration}ms ${motion.easing}`
          : undefined,
        ...style,
      }}
    />
  );
}
