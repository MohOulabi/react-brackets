import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  Bracket,
  type Participant,
  singleElimination,
  usePagination,
  useZoom,
  type ZoomState,
} from '../src';
import { bounds, glide, stretchTransform } from '../src/hooks/use-pan-zoom';
import { rubberBand } from '../src/hooks/use-swipe';
import { resolveSwipe, resolveZoom } from '../src/options';

const players = (count: number): Participant[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
  }));

const stage = singleElimination(players(8));

afterEach(cleanup);

describe('pagination parts', () => {
  test('draw your own navigation from the parts', () => {
    const { container } = render(
      <Bracket.Root stage={stage}>
        <Bracket.Viewport>
          <Bracket.Rounds>{() => <Bracket.Round />}</Bracket.Rounds>
        </Bracket.Viewport>
        <Bracket.Pagination className="pills">
          <Bracket.PreviousPage>
            {({ disabled }) => (disabled ? 'start' : 'back')}
          </Bracket.PreviousPage>
          <Bracket.PageButton index={1} className={({ active }) => (active ? 'on' : 'off')}>
            {({ round }) => `Go to ${round.name}`}
          </Bracket.PageButton>
          <Bracket.PageIndicator />
          <Bracket.NextPage>on</Bracket.NextPage>
        </Bracket.Pagination>
      </Bracket.Root>,
    );

    expect(container.querySelector('[data-part="pagination"]')?.className).toBe('pills');
    expect(screen.getByRole('button', { name: 'Previous round' }).textContent).toBe('start');
    const semifinals = screen.getByRole('button', { name: 'Go to Semifinals' });
    expect(semifinals.className).toBe('off');

    fireEvent.click(semifinals);
    expect(semifinals.className).toBe('on');
    expect(semifinals.getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('button', { name: 'Previous round' }).textContent).toBe('back');
    expect(container.querySelector('[data-part="page-indicator"]')).not.toBeNull();
  });

  test('usePagination reads and moves the paged view from anywhere in the root', () => {
    function Steps() {
      const pagination = usePagination();
      return (
        <p>
          <button type="button" disabled={!pagination.canNext} onClick={pagination.next}>
            forward
          </button>
          <span data-testid="where">
            {pagination.page + 1} of {pagination.rounds.length}, {String(pagination.paged)}
          </span>
        </p>
      );
    }
    render(
      <Bracket.Root stage={stage}>
        <Steps />
      </Bracket.Root>,
    );

    expect(screen.getByTestId('where').textContent).toBe('1 of 3, true');
    fireEvent.click(screen.getByText('forward'));
    fireEvent.click(screen.getByText('forward'));
    expect(screen.getByTestId('where').textContent).toBe('3 of 3, true');
    expect((screen.getByText('forward') as HTMLButtonElement).disabled).toBe(true);
  });

  test('renderPagination replaces the default navigation', () => {
    render(
      <Bracket
        stage={stage}
        renderPagination={() => (
          <Bracket.Pagination>
            <Bracket.NextPage>Next</Bracket.NextPage>
          </Bracket.Pagination>
        )}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Quarterfinals' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Next round' }).textContent).toBe('Next');
  });
});

describe('zoom parts', () => {
  const sizes = ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight'] as const;
  const saved = new Map<string, PropertyDescriptor | undefined>();

  // A 400 × 300 viewport around a tree twice as wide, so it fits at half size.
  beforeEach(() => {
    for (const size of sizes) {
      saved.set(size, Object.getOwnPropertyDescriptor(HTMLElement.prototype, size));
      Object.defineProperty(HTMLElement.prototype, size, {
        configurable: true,
        get(this: HTMLElement) {
          const tree = this.getAttribute('data-part') === 'content';
          if (size.endsWith('Width')) return tree ? 800 : 400;
          return tree ? 600 : 300;
        },
      });
    }
  });
  afterEach(() => {
    for (const size of sizes) {
      const descriptor = saved.get(size);
      if (descriptor) Object.defineProperty(HTMLElement.prototype, size, descriptor);
    }
  });

  test('the default controls show the level, and stop at the limits', () => {
    render(<Bracket stage={stage} compactBelow={0} mode="pan-zoom" zoom={{ maxScale: 1 }} />);
    const zoomIn = screen.getByRole('button', { name: 'Zoom in' }) as HTMLButtonElement;
    const zoomOut = screen.getByRole('button', { name: 'Zoom out' }) as HTMLButtonElement;
    const fit = screen.getByRole('button', { name: 'Fit to view' }) as HTMLButtonElement;

    expect(screen.getByText('50%')).toBeDefined();
    expect(zoomOut.disabled).toBe(true);
    expect(fit.disabled).toBe(true);

    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    expect(screen.getByText('100%')).toBeDefined();
    expect(zoomIn.disabled).toBe(true);
    expect(fit.disabled).toBe(false);

    fireEvent.click(fit);
    expect(screen.getByText('50%')).toBeDefined();
  });

  test('controls={false} leaves the corner empty, for controls of your own anywhere', () => {
    let zoom: ZoomState | null = null;
    function Readout() {
      zoom = useZoom();
      return <output>{zoom ? `${Math.round(zoom.scale * 100)}` : 'none'}</output>;
    }
    const { container } = render(
      <Bracket.Root stage={stage} compactBelow={0} zoom={{ step: 2 }}>
        <Bracket.Viewport mode="pan-zoom" controls={false}>
          <Bracket.Rounds>{() => <Bracket.Round />}</Bracket.Rounds>
        </Bracket.Viewport>
        <Readout />
        <Bracket.ZoomControls>
          <Bracket.ZoomIn>{({ percent }) => `in from ${percent}`}</Bracket.ZoomIn>
        </Bracket.ZoomControls>
      </Bracket.Root>,
    );

    expect(container.querySelectorAll('[data-part="zoom-controls"]')).toHaveLength(1);
    expect(screen.getByText('50')).toBeDefined();
    fireEvent.click(screen.getByText('in from 50'));
    expect(screen.getByText('100')).toBeDefined();

    act(() => zoom?.zoomTo(10));
    expect(screen.getByText('200')).toBeDefined();
    act(() => zoom?.reset());
    expect(screen.getByText('50')).toBeDefined();
  });

  test('useZoom is null outside a pan and zoom viewport', () => {
    let seen: ZoomState | null | undefined;
    function Probe() {
      seen = useZoom();
      return null;
    }
    render(
      <Bracket.Root stage={stage} compactBelow={0}>
        <Bracket.Viewport mode="fit" />
        <Probe />
      </Bracket.Root>,
    );
    expect(seen).toBeNull();
  });

  test('starts where `initial` says, and reports changes', () => {
    const changes: number[] = [];
    render(
      <Bracket
        stage={stage}
        compactBelow={0}
        mode="pan-zoom"
        zoom={{ initial: 1, onZoomChange: (scale) => changes.push(scale) }}
      />,
    );

    expect(screen.getByText('100%')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }));
    expect(changes.at(-1)).toBe(0.5);
  });

  test('the keyboard zooms and fits while the viewport has focus', () => {
    const { container } = render(<Bracket stage={stage} compactBelow={0} mode="pan-zoom" />);
    const viewport = container.querySelector('[data-part="viewport"]') as HTMLElement;

    expect(viewport.tabIndex).toBe(0);
    fireEvent.keyDown(viewport, { key: '+' });
    expect(screen.getByText('63%')).toBeDefined();
    fireEvent.keyDown(viewport, { key: '0' });
    expect(screen.getByText('50%')).toBeDefined();
  });

  test('keyboard: false keeps the viewport out of the tab order', () => {
    const { container } = render(
      <Bracket stage={stage} compactBelow={0} mode="pan-zoom" zoom={{ keyboard: false }} />,
    );
    expect((container.querySelector('[data-part="viewport"]') as HTMLElement).tabIndex).toBe(-1);
  });
});

describe('zoom and swipe options', () => {
  test('fill in every default', () => {
    expect(resolveZoom()).toMatchObject({
      minScale: 'fit',
      maxScale: 2,
      step: 1.25,
      wheel: 0.01,
      doubleTap: 'toggle',
      deceleration: 0.998,
      elasticity: 0.55,
      overshoot: 0.15,
      align: 'start',
    });
    expect(resolveSwipe()).toEqual({
      focus: 0.76,
      commit: 0.2,
      projection: 0.18,
      elasticity: 0.55,
    });
  });

  test('turn behaviours off', () => {
    const off = resolveZoom({ wheel: false, momentum: false, doubleTap: false });
    expect([off.wheel, off.deceleration, off.doubleTap]).toEqual([0, 0, false]);
    expect(resolveZoom({ wheel: { sensitivity: 0.02 } }).wheel).toBe(0.02);
    expect(resolveZoom({ momentum: { deceleration: 0.99 } }).deceleration).toBe(0.99);
  });
});

describe('pan and zoom maths', () => {
  const frame = { width: 400, height: 300, contentWidth: 800, contentHeight: 600, rtl: false };

  test('a tree smaller than the frame rests at the start, or in the centre', () => {
    expect(bounds(0.25, frame, 'start')).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
    expect(bounds(0.25, frame, 'center')).toEqual({ minX: 100, maxX: 100, minY: 75, maxY: 75 });
    expect(bounds(1, frame)).toEqual({ minX: -400, maxX: 0, minY: -300, maxY: 0 });
  });

  test('pulling past an edge gives less and less, and not at all without elasticity', () => {
    const pulled = stretchTransform({ x: 100, y: 0, scale: 1 }, frame, 'start', 0.55);
    expect(pulled.x).toBeGreaterThan(0);
    expect(pulled.x).toBeLessThan(100);
    expect(stretchTransform({ x: 100, y: 0, scale: 1 }, frame, 'start', 0).x).toBe(0);
    expect(rubberBand(200, 400, 0)).toBe(0);
    expect(rubberBand(200, 400, 0.55)).toBeLessThan(rubberBand(200, 400, 1));
  });

  test('a glide slows by the deceleration and covers the integrated distance', () => {
    const { speed, distance } = glide(1, 0.998, 100);
    expect(speed).toBeCloseTo(0.998 ** 100);
    expect(distance).toBeGreaterThan(80);
    expect(distance).toBeLessThan(100);
    expect(glide(1, 0.99, 1000).speed).toBeLessThan(0.001);
  });
});
