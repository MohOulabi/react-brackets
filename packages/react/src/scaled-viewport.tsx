import { type ComponentPropsWithoutRef, type ReactNode, useRef, useState } from 'react';
import { useBracketContext } from './context';
import { useIsomorphicLayoutEffect } from './hooks/use-isomorphic-layout-effect';
import {
  clampTransform,
  type Frame,
  type Transform,
  usePanZoom,
  zoomAt,
} from './hooks/use-pan-zoom';
import { Icon } from './icons';
import { GridContent } from './viewport';

interface ScaledViewportProps extends ComponentPropsWithoutRef<'div'> {
  interactive: boolean;
  controls: boolean;
  minScale: number | undefined;
  maxScale: number;
}

const ZOOM_STEP = 1.25;
const emptyFrame: Frame = { width: 0, height: 0, contentWidth: 0, contentHeight: 0, rtl: false };

/** The full tree scaled to fit its container, optionally with pan and zoom on top. */
export function ScaledViewport({
  interactive,
  controls,
  minScale,
  maxScale,
  style,
  children,
  ...props
}: ScaledViewportProps): ReactNode {
  const { motion } = useBracketContext();
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(emptyFrame);
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

  const fitScale = frame.contentWidth > 0 ? Math.min(1, frame.width / frame.contentWidth) : 1;
  const fittedHeight = frame.contentHeight * fitScale;
  const fitted = clampTransform(
    { x: 0, y: 0, scale: fitScale },
    { ...frame, height: fittedHeight },
  );
  const current = interactive && transform ? clampTransform(transform, frame) : fitted;

  const change = (next: Transform | null, animate: boolean) => {
    setSmooth(animate);
    setTransform(next);
  };

  const handlers = usePanZoom({
    viewport,
    frame,
    transform: current,
    onChange: (next) => change(next, false),
    minScale: minScale ?? Math.min(fitScale, 1),
    maxScale,
  });

  const zoomBy = (factor: number) => {
    const scale = Math.min(maxScale, Math.max(minScale ?? fitScale, current.scale * factor));
    change(zoomAt(current, frame, { x: frame.width / 2, y: frame.height / 2 }, scale), true);
  };

  return (
    <div
      {...props}
      {...(interactive ? handlers : {})}
      ref={viewport}
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: fittedHeight || undefined,
        touchAction: interactive ? 'none' : undefined,
        cursor: interactive ? 'grab' : undefined,
        userSelect: interactive ? 'none' : undefined,
        ...style,
      }}
    >
      <GridContent
        contentRef={content}
        style={{
          position: 'absolute',
          insetBlockStart: 0,
          left: 0,
          transformOrigin: '0 0',
          transform: `translate(${current.x}px, ${current.y}px) scale(${current.scale})`,
          transition:
            smooth && motion ? `transform ${motion.duration}ms ${motion.easing}` : undefined,
        }}
      >
        {children}
      </GridContent>
      {interactive && controls && (
        <ZoomControls
          onZoomIn={() => zoomBy(ZOOM_STEP)}
          onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
          onReset={() => change(null, true)}
        />
      )}
    </div>
  );
}

function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}): ReactNode {
  const { labels, classNames } = useBracketContext();
  const button = (part: 'zoom-in' | 'zoom-out' | 'zoom-reset', label: string) => ({
    type: 'button' as const,
    'data-scope': 'bracket',
    'data-part': part,
    'aria-label': label,
    className: classNames[part],
  });

  return (
    <div
      data-scope="bracket"
      data-part="zoom-controls"
      className={classNames['zoom-controls']}
      style={{ position: 'absolute', insetBlockEnd: 8, insetInlineEnd: 8, display: 'flex' }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button {...button('zoom-out', labels.zoomOut)} onClick={onZoomOut}>
        <Icon name="minus" />
      </button>
      <button {...button('zoom-reset', labels.zoomReset)} onClick={onReset}>
        <Icon name="fit" />
      </button>
      <button {...button('zoom-in', labels.zoomIn)} onClick={onZoomIn}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
