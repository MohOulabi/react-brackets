import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { type ClassNameProp, flag, type Part, useBracketContext, usePart } from './context';
import { Icon } from './icons';
import { useZoom, type ZoomState } from './zoom';

/** Passed to a zoom part's `className` and `children` when they are functions. */
export interface ZoomPartState {
  /** The zoom now. */
  scale: number;
  /** The zoom as a whole percentage, like `150`. */
  percent: number;
  /** `true` when the control can't act: at the limit it moves towards, or already fitted. */
  disabled: boolean;
}

/** Props of `Bracket.ZoomControls`: any prop of a `div`. */
export interface ZoomControlsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'className'> {
  /** A class, or a function of the zoom. */
  className?: ClassNameProp<ZoomPartState>;
}

/** Props of `Bracket.ZoomIn`, `Bracket.ZoomOut` and `Bracket.ZoomReset`: any prop of a `button`. */
export interface ZoomButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'> {
  /** A class, or a function of the zoom. */
  className?: ClassNameProp<ZoomPartState>;
  /** What the button shows, or a function of the zoom. The default icon without it. */
  children?: ReactNode | ((state: ZoomPartState) => ReactNode);
  /** For `ZoomIn` and `ZoomOut`: how much to zoom by. The `zoom.step` option without it. */
  step?: number;
}

/** Props of `Bracket.ZoomLevel`: any prop of a `span`. */
export interface ZoomLevelProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'children'> {
  /** A class, or a function of the zoom. */
  className?: ClassNameProp<ZoomPartState>;
  /** What it shows, or a function of the zoom. `150%` without it. */
  children?: ReactNode | ((state: ZoomPartState) => ReactNode);
}

const percentOf = (scale: number) => Math.round(scale * 100);

/**
 * The zoom controls: zoom out, the zoom level and zoom in, then fit, by default. Pass children to build your own
 * from the zoom parts or `useZoom()`. Place it anywhere inside `Bracket.Root`; it draws nothing while the
 * bracket isn't showing a pan and zoom viewport.
 */
export function ZoomControls({
  className,
  children,
  onPointerDown,
  ...props
}: ZoomControlsProps): ReactNode {
  const zoom = useZoom();
  const { classNames } = useBracketContext();
  const state: ZoomPartState = {
    scale: zoom?.scale ?? 1,
    percent: percentOf(zoom?.scale ?? 1),
    disabled: false,
  };
  const part = usePart('zoom-controls', className, state);
  if (!zoom) return null;
  return (
    <div
      {...props}
      {...part}
      // Pressing a control never starts a drag of the tree behind it.
      onPointerDown={(event) => {
        event.stopPropagation();
        onPointerDown?.(event);
      }}
    >
      {children ?? (
        <>
          <span data-scope="bracket" data-part="zoom-steps" className={classNames['zoom-steps']}>
            <ZoomOut />
            <ZoomLevel />
            <ZoomIn />
          </span>
          <ZoomReset />
        </>
      )}
    </div>
  );
}

function ZoomButton({
  part,
  label,
  icon,
  disabled,
  onPress,
  className,
  children,
  onClick,
  zoom,
  ...props
}: Omit<ZoomButtonProps, 'step'> & {
  part: Part;
  label: string;
  icon: 'plus' | 'minus' | 'fit';
  disabled: boolean;
  onPress: () => void;
  zoom: ZoomState;
}) {
  const state: ZoomPartState = { scale: zoom.scale, percent: percentOf(zoom.scale), disabled };
  const attributes = usePart(part, className, state);
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      data-disabled={flag(disabled)}
      {...props}
      {...attributes}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPress();
      }}
    >
      {typeof children === 'function' ? children(state) : (children ?? <Icon name={icon} />)}
    </button>
  );
}

/** Zooms in around the centre. Disabled at the largest zoom. */
export function ZoomIn({ step, ...props }: ZoomButtonProps): ReactNode {
  const zoom = useZoom();
  const { labels } = useBracketContext();
  if (!zoom) return null;
  return (
    <ZoomButton
      {...props}
      zoom={zoom}
      part="zoom-in"
      label={labels.zoomIn}
      icon="plus"
      disabled={!zoom.canZoomIn}
      onPress={() => zoom.zoomIn(step)}
    />
  );
}

/** Zooms out around the centre. Disabled at the smallest zoom. */
export function ZoomOut({ step, ...props }: ZoomButtonProps): ReactNode {
  const zoom = useZoom();
  const { labels } = useBracketContext();
  if (!zoom) return null;
  return (
    <ZoomButton
      {...props}
      zoom={zoom}
      part="zoom-out"
      label={labels.zoomOut}
      icon="minus"
      disabled={!zoom.canZoomOut}
      onPress={() => zoom.zoomOut(step)}
    />
  );
}

/** Fits the whole tree back into view. Disabled while it already is. */
export function ZoomReset({ step: _step, ...props }: ZoomButtonProps): ReactNode {
  const zoom = useZoom();
  const { labels } = useBracketContext();
  if (!zoom) return null;
  return (
    <ZoomButton
      {...props}
      zoom={zoom}
      part="zoom-reset"
      label={labels.zoomReset}
      icon="fit"
      disabled={!zoom.canReset}
      onPress={zoom.reset}
    />
  );
}

/** The zoom as a percentage, announced as it changes. */
export function ZoomLevel({ className, children, ...props }: ZoomLevelProps): ReactNode {
  const zoom = useZoom();
  const state: ZoomPartState = {
    scale: zoom?.scale ?? 1,
    percent: percentOf(zoom?.scale ?? 1),
    disabled: false,
  };
  const part = usePart('zoom-level', className, state);
  if (!zoom) return null;
  return (
    <span aria-live="polite" {...props} {...part}>
      {typeof children === 'function' ? children(state) : (children ?? `${state.percent}%`)}
    </span>
  );
}
