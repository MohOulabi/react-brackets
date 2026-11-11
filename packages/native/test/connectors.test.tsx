import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { Bracket, type ConnectorState, lightTheme, reportResult, useConnector } from '../src';
import { drawn, eight, filled } from './render';

afterEach(cleanup);

/** A line of your own: says whether it runs left to right. */
function Line() {
  const { points, from } = useConnector();
  const { start, end } = points.value;
  return <span data-line={from.id}>{start.x < end.x ? 'forward' : 'back'}</span>;
}

const line = lightTheme.colors.line;
const accent = lightTheme.colors.accent;

describe.each([
  ['paged view', 600],
  ['full tree', 0],
])('renderConnector in the %s', (_, compactBelow) => {
  test('is called for every line with its matches and where it runs', () => {
    const seen: ConnectorState[] = [];
    render(
      <Bracket
        stage={eight}
        compactBelow={compactBelow}
        renderConnector={(connector) => {
          seen.push(connector);
          return <Bracket.Connector />;
        }}
      />,
    );
    const last = new Map(seen.map((connector) => [connector.from.id, connector]));
    expect(last.size).toBe(6);
    const first = last.get('main.r1.m1');
    expect(first?.to.id).toBe('main.r2.m1');
    expect(first?.slot).toBe(0);
    expect(first?.status).toBe('ready');
    expect(first?.highlighted).toBe(false);
    const { start, end, opacity } = first?.points.value ?? {};
    expect(start && end && start.x < end.x).toBe(true);
    expect(opacity).toBe(1);
  });

  test('draws a plain Bracket.Connector like the default line', () => {
    const plain = render(<Bracket stage={eight} compactBelow={compactBelow} />);
    const lines = filled(plain.container, line);
    cleanup();
    const own = render(
      <Bracket
        stage={eight}
        compactBelow={compactBelow}
        renderConnector={() => <Bracket.Connector />}
      />,
    );
    expect(lines).toBeGreaterThan(0);
    expect(filled(own.container, line)).toBe(lines);
  });

  test('colours each line from a style function of its state', () => {
    const stage = reportResult(eight, 'main.r1.m1', { scores: [2, 0] });
    const { container } = render(
      <Bracket
        stage={stage}
        compactBelow={compactBelow}
        renderConnector={() => (
          <Bracket.Connector
            style={({ status }) => ({ color: status === 'completed' ? 'green' : 'gray' })}
          />
        )}
      />,
    );
    // Three straight pieces a line; the rest of the lines are gray.
    expect(filled(container, 'green')).toBe(3);
    expect(filled(container, 'gray')).toBe(15);
    expect(filled(container, line)).toBe(0);
  });

  test('keeps the accent for the highlighted path unless the style says otherwise', () => {
    const stage = reportResult(eight, 'main.r1.m1', { scores: [2, 0] });
    const { container } = render(
      <Bracket
        stage={stage}
        compactBelow={compactBelow}
        highlighted="t1"
        renderConnector={() => <Bracket.Connector style={{ width: 3 }} />}
      />,
    );
    expect(filled(container, accent)).toBe(3);
  });

  test('leaves out a line its function returns null for', () => {
    const { container } = render(
      <Bracket
        stage={eight}
        compactBelow={compactBelow}
        renderConnector={({ from }) =>
          from.id === 'main.r1.m1' ? null : <Bracket.Connector style={{ color: 'gray' }} />
        }
      />,
    );
    expect(filled(container, 'gray')).toBe(15);
  });

  test('draws dashes along a dashed line', () => {
    const { container } = render(
      <Bracket
        stage={eight}
        compactBelow={compactBelow}
        renderConnector={() => <Bracket.Connector dash="dashed" style={{ color: 'gray' }} />}
      />,
    );
    const dashes = drawn(container).filter(({ style }) => style.backgroundColor === 'gray');
    // Many short dashes, square ended, rather than three stretched pieces a line.
    expect(dashes.length).toBeGreaterThan(6 * 10);
    expect(dashes.every(({ style }) => !style.borderRadius)).toBe(true);
  });

  test('draws round dots along a dotted line', () => {
    const { container } = render(
      <Bracket
        stage={eight}
        compactBelow={compactBelow}
        renderConnector={() => (
          <Bracket.Connector dash="dotted" style={{ color: 'gray', width: 2 }} />
        )}
      />,
    );
    const dots = drawn(container).filter(({ style }) => style.backgroundColor === 'gray');
    expect(dots.length).toBeGreaterThan(6 * 10);
    expect(dots.every(({ style }) => style.borderRadius === 1)).toBe(true);
  });

  test('points an arrowhead into the next match', () => {
    const { container } = render(
      <Bracket
        stage={eight}
        compactBelow={compactBelow}
        renderConnector={() => <Bracket.Connector arrow={8} style={{ color: 'gray' }} />}
      />,
    );
    const heads = drawn(container).filter(({ style }) => style.borderLeftColor === 'gray');
    expect(heads.length).toBe(6);
    expect(heads[0]?.style.borderLeftWidth).toBe(8);
  });

  test('draws anything else from the points, with useConnector inside', () => {
    const { container } = render(
      <Bracket stage={eight} compactBelow={compactBelow} renderConnector={() => <Line />} />,
    );
    const lines = container.querySelectorAll('[data-line]');
    expect(lines.length).toBe(6);
    expect([...lines].every((element) => element.textContent === 'forward')).toBe(true);
  });
});

test('Bracket.Connector outside renderConnector says where it belongs', () => {
  expect(() => render(<Bracket.Connector />)).toThrow('renderConnector');
});
