import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useBracketContext } from './context';
import { useIsomorphicLayoutEffect } from './hooks/use-isomorphic-layout-effect';
import {
  clampTransform,
  type Frame,
  type Transform,
  usePanZoom,
  zoomAt,
} from './hooks/use-pan-zoom';
import { GridContent } from './viewport';
import { ZoomContext, type ZoomState } from './zoom';
import { ZoomControls } from './zoom-controls';

interface ScaledViewportProps extends ComponentPropsWithoutRef<'div'> {
  interactive: boolean;
  controls: boolean;
  /** Overrides the `zoom.minScale` option. */
  minScale: number | undefined;
  /** Overrides the `zoom.maxScale` option. */
  maxScale: number | undefined;
}

const emptyFrame: Frame = { width: 0, height: 0, contentWidth: 0, contentHeight: 0, rtl: false };

/** The full tree scaled to fit its container, optionally with pan and zoom on top. */
export function ScaledViewport({
  interactive,
  controls,
  minScale: minScaleProp,
  maxScale: maxScaleProp,
  style,
  children,
  ...props
}: ScaledViewportProps): ReactNode {
  const { motion, zoom: options } = useBracketContext();
  const store = useContext(ZoomContext);
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const live = useRef(false);
  const [frame, setFrame] = useState(emptyFrame);
  // `null` is fitted: where the tree starts, and where fitting it again takes it.
  const [transform, setTransform] = useState<Transform | null>(null);
  const [smooth, setSmooth] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const outer = viewport.current;
    const inner = content.current;
    if (!outer || !inner) return;
    const measure = () =>
      setFrame({
        width: outer.clientWidth,
        height: outer.clientHeight,
        contentWidth: inner.offsetWidth,
        contentHeight: inner.offsetHeight,
        rtl: getComputedStyle(outer).direction === 'rtl',
      });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  // Until it is measured, as in server-rendered HTML, the tree stays in the flow at its natural size, so the
  // viewport has a real height on first paint instead of collapsing and then jumping open.
  const measured = frame.contentWidth > 0;
  const fitScale = measured ? Math.min(1, frame.width / frame.contentWidth) : 1;
  const fittedHeight = frame.contentHeight * fitScale;
  const minScale = Math.min(
    fitScale,
    minScaleProp ?? (options.minScale === 'fit' ? fitScale : options.minScale),
  );
  const maxScale = Math.max(minScale, maxScaleProp ?? options.maxScale);
  const fitted = clampTransform(
    { x: 0, y: 0, scale: fitScale },
    { ...frame, height: fittedHeight },
    options.align,
  );
  // While a finger or a glide moves it, the tree is drawn exactly there, even pulled past an edge.
  const current =
    interactive && transform
      ? live.current
        ? transform
        : clampTransform(transform, frame, options.align)
      : fitted;

  const change = (next: Transform | null, animate: boolean) => {
    setSmooth(animate && !live.current);
    setTransform(next);
  };
  const reset = () => {
    live.current = false;
    change(null, true);
  };
  const zoomTo = (scale: number, focus = { x: frame.width / 2, y: frame.height / 2 }) => {
    live.current = false;
    const next = Math.min(maxScale, Math.max(minScale, scale));
    change(zoomAt(current, frame, focus, next, options.align), true);
  };
  const panTo = (x: number, y: number) => {
    live.current = false;
    change(clampTransform({ ...current, x, y }, frame, options.align), true);
  };

  // Starts where the `initial` option says, once there is a size to place it in.
  const placed = useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (!interactive || !measured || placed.current) return;
    placed.current = true;
    const { initial } = options;
    if (initial === 'fit') return;
    const start = typeof initial === 'number' ? { x: 0, y: 0, scale: initial } : initial;
    const scale = Math.min(maxScale, Math.max(minScale, start.scale));
    setTransform(clampTransform({ ...start, scale }, frame, options.align));
  });

  const handlers = usePanZoom({
    viewport,
    frame,
    transform: current,
    onChange: change,
    onReset: reset,
    minScale,
    maxScale,
    fitScale,
    options,
    live,
  });

  // Controls anywhere in the bracket read and move the zoom through the store. Actions read the latest state.
  const actions = useRef({ zoomTo, panTo, reset, current, step: options.step });
  actions.current = { zoomTo, panTo, reset, current, step: options.step };
  const isFitted = !transform || (transform.scale === fitScale && !live.current);
  useIsomorphicLayoutEffect(() => {
    if (!store || !interactive) return;
    const state: ZoomState = {
      scale: current.scale,
      fitScale,
      minScale,
      maxScale,
      canZoomIn: current.scale < maxScale - 0.001,
      canZoomOut: current.scale > minScale + 0.001,
      fitted: isFitted,
      zoomIn: (step) =>
        actions.current.zoomTo(actions.current.current.scale * (step ?? actions.current.step)),
      zoomOut: (step) =>
        actions.current.zoomTo(actions.current.current.scale / (step ?? actions.current.step)),
      zoomTo: (scale, focus) => actions.current.zoomTo(scale, focus),
      panBy: (dx, dy) =>
        actions.current.panTo(actions.current.current.x + dx, actions.current.current.y + dy),
      panTo: (x, y) => actions.current.panTo(x, y),
      reset: () => actions.current.reset(),
    };
    store.set(state);
  }, [store, interactive, current.scale, fitScale, minScale, maxScale, isFitted]);
  useEffect(() => (store && interactive ? () => store.set(null) : undefined), [store, interactive]);

  const reported = useRef(current.scale);
  useEffect(() => {
    if (!interactive || reported.current === current.scale) return;
    reported.current = current.scale;
    options.onZoomChange?.(current.scale);
  }, [interactive, current.scale, options]);

  return (
    <div
      {...props}
      {...(interactive ? handlers : {})}
      ref={viewport}
      tabIndex={interactive && options.keyboard ? 0 : undefined}
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: fittedHeight || undefined,
        touchAction: interactive ? 'none' : undefined,
        cursor: interactive && options.pan ? 'grab' : undefined,
        userSelect: interactive ? 'none' : undefined,
        ...style,
      }}
    >
      <GridContent
        contentRef={content}
        style={
          measured
            ? {
                position: 'absolute',
                insetBlockStart: 0,
                left: 0,
                transformOrigin: '0 0',
                transform: `translate(${current.x}px, ${current.y}px) scale(${current.scale})`,
                transition:
                  smooth && motion ? `transform ${motion.duration}ms ${motion.easing}` : undefined,
              }
            : undefined
        }
      >
        {children}
      </GridContent>
      {interactive && controls && (
        <ZoomControls
          style={{ position: 'absolute', insetBlockEnd: 8, insetInlineEnd: 8, display: 'flex' }}
        />
      )}
    </div>
  );
}
