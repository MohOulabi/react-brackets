import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from 'react';
import { type ClassNameProp, useBracketContext, usePart, type View } from './context';
import { PagedBracketViewport, PagedListViewport } from './paged-viewport';
import { ScaledViewport } from './scaled-viewport';

/**
 * How the full tree fits its container.
 * - `scroll`: native horizontal scrolling.
 * - `fit`: scaled down to the width available.
 * - `pan-zoom`: drag, pinch, or ctrl/⌘ + scroll to zoom, with zoom buttons.
 */
export type ViewportMode = 'scroll' | 'fit' | 'pan-zoom';

/** Passed to `className` when it is a function. */
export interface ViewportState {
  view: View;
  mode: ViewportMode;
}

/** The props `Bracket.Viewport` adds on top of a regular `div`. */
export interface ViewportOwnProps {
  /**
   * How the full tree fits its container. The paged view ignores it.
   * @defaultValue 'scroll'
   */
  mode?: ViewportMode;
  /**
   * Shows the default zoom controls in the corner in `pan-zoom` mode. Set it to `false` to place
   * `Bracket.ZoomControls`, or controls of your own built with `useZoom()`, anywhere else.
   * @defaultValue true
   */
  controls?: boolean;
  /**
   * The smallest zoom in `pan-zoom` mode. A shorthand for the `zoom.minScale` option of the root.
   * @defaultValue the scale that fits the whole bracket, at most 1
   */
  minScale?: number;
  /**
   * The largest zoom in `pan-zoom` mode. A shorthand for the `zoom.maxScale` option of the root.
   * @defaultValue 2
   */
  maxScale?: number;
  /** A class, or a function of the viewport's state. */
  className?: ClassNameProp<ViewportState>;
}

/** Every `ViewportOwnProps` prop, plus any prop of a `div`. */
export interface ViewportProps
  extends ViewportOwnProps,
    Omit<ComponentPropsWithoutRef<'div'>, keyof ViewportOwnProps> {}

/** The scrolling, scaling or paging window the rounds are drawn in. */
export function Viewport({
  mode = 'scroll',
  controls = true,
  minScale,
  maxScale,
  className,
  style,
  children,
  ...props
}: ViewportProps): ReactNode {
  const { view, compact } = useBracketContext();
  const part = usePart('viewport', className, { view, mode });

  if (view === 'paged') {
    const Paged = compact === 'bracket' ? PagedBracketViewport : PagedListViewport;
    return (
      <Paged {...props} {...part} style={style}>
        {children}
      </Paged>
    );
  }

  if (mode !== 'scroll') {
    return (
      <ScaledViewport
        {...props}
        {...part}
        data-mode={mode}
        interactive={mode === 'pan-zoom'}
        controls={controls}
        minScale={minScale}
        maxScale={maxScale}
        style={style}
      >
        {children}
      </ScaledViewport>
    );
  }

  return (
    <div
      {...props}
      {...part}
      data-mode={mode}
      style={{ overflow: 'auto', overscrollBehaviorX: 'contain', ...style }}
    >
      <GridContent>{children}</GridContent>
    </div>
  );
}

export function GridContent({
  children,
  contentRef,
  columnWidth,
  style,
}: {
  children: ReactNode;
  contentRef?: Ref<HTMLDivElement>;
  columnWidth?: number;
  style?: CSSProperties;
}): ReactNode {
  const { columns, layout, classNames } = useBracketContext();
  const track = columnWidth === undefined ? 'max-content' : `${columnWidth}px`;
  return (
    <div
      ref={contentRef}
      data-scope="bracket"
      data-part="content"
      data-grid=""
      className={classNames.content}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.filter((column) => !column.leaving).length}, ${track})`,
        gridTemplateRows: `auto repeat(${layout.rows}, auto)`,
        width: 'max-content',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
