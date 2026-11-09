import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import {
  Bracket,
  doubleElimination,
  type Participant,
  reportResult,
  singleElimination,
} from '../src';

const players = (count: number): Participant[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
  }));

const parts = (container: HTMLElement, part: string) =>
  container.querySelectorAll(`[data-scope="bracket"][data-part="${part}"]`);

afterEach(cleanup);

describe('tree view', () => {
  const tree = { compactBelow: 0 };

  test('renders every round and match', () => {
    const { container } = render(<Bracket stage={singleElimination(players(8))} {...tree} />);

    expect(parts(container, 'round')).toHaveLength(3);
    expect(parts(container, 'match')).toHaveLength(7);
    expect(screen.getByText('Quarterfinals')).toBeDefined();
    expect(container.querySelector('[data-part="root"]')?.getAttribute('data-view')).toBe('tree');
  });

  test('places matches on the grid between their feeders', () => {
    const { container } = render(<Bracket stage={singleElimination(players(4))} {...tree} />);
    const rows = [...parts(container, 'cell')].map((cell) => (cell as HTMLElement).style.gridRow);

    expect(rows).toEqual(['1 / span 2', '3 / span 2', '2 / span 2']);
  });

  test('exposes state through data attributes', () => {
    const stage = reportResult(singleElimination(players(4)), 'main.r1.m1', { scores: [2, 1] });
    const { container } = render(<Bracket stage={stage} {...tree} />);
    const [winner, loser] = parts(container, 'participant');

    expect(winner?.hasAttribute('data-winner')).toBe(true);
    expect(loser?.hasAttribute('data-loser')).toBe(true);
    expect(parts(container, 'match')[0]?.getAttribute('data-status')).toBe('completed');
    expect(screen.getAllByText('TBD')).toHaveLength(1);
  });

  test('marks byes and labels them', () => {
    const { container } = render(
      <Bracket stage={singleElimination(players(3))} labels={{ bye: 'Free pass' }} {...tree} />,
    );

    expect(container.querySelector('[data-part="participant"][data-bye]')).not.toBeNull();
    expect(screen.getByText('Free pass')).toBeDefined();
  });

  test('applies classNames to every part', () => {
    const { container } = render(
      <Bracket
        stage={singleElimination(players(4))}
        classNames={{ match: 'card', participant: 'row', 'round-title': 'title' }}
        {...tree}
      />,
    );

    expect(container.querySelectorAll('.card')).toHaveLength(3);
    expect(container.querySelectorAll('.row')).toHaveLength(6);
    expect(container.querySelectorAll('.title')).toHaveLength(2);
  });

  test('highlights a participant across the bracket on hover', () => {
    const stage = reportResult(singleElimination(players(4)), 'main.r1.m1', { scores: [2, 1] });
    const { container } = render(<Bracket stage={stage} {...tree} />);

    const [first] = screen.getAllByText('Player 1');
    if (!first?.parentElement) throw new Error('missing participant');
    fireEvent.pointerEnter(first.parentElement, { pointerType: 'mouse' });

    expect(container.querySelectorAll('[data-part="participant"][data-highlighted]')).toHaveLength(
      2,
    );
    fireEvent.pointerLeave(first.parentElement);
    expect(container.querySelectorAll('[data-highlighted]')).toHaveLength(0);
  });

  test('makes matches interactive when onMatchClick is set', () => {
    const onMatchClick = mock();
    const { container } = render(
      <Bracket stage={singleElimination(players(4))} onMatchClick={onMatchClick} {...tree} />,
    );
    const match = parts(container, 'match')[0] as HTMLElement;

    expect(match.getAttribute('role')).toBe('button');
    fireEvent.click(match);
    fireEvent.keyDown(match, { key: 'Enter' });
    expect(onMatchClick).toHaveBeenCalledTimes(2);
    expect(onMatchClick.mock.calls[0]?.[0]).toMatchObject({ id: 'main.r1.m1' });
  });

  test('renders a custom match', () => {
    render(
      <Bracket
        stage={singleElimination(players(2))}
        renderMatch={(match) => <output>{match.id}</output>}
        {...tree}
      />,
    );
    expect(screen.getByText('main.r1.m1')).toBeDefined();
  });

  test('mirrors the bracket around the final', () => {
    const { container } = render(
      <Bracket stage={singleElimination(players(8))} layout="mirrored" {...tree} />,
    );
    const sides = [...parts(container, 'round')].map((round) => round.getAttribute('data-side'));

    expect(sides).toEqual(['start', 'start', 'center', 'end', 'end']);
  });
});

describe('paged view', () => {
  const titles = (container: HTMLElement) =>
    [...parts(container, 'round-title')].map((title) => title.textContent);

  test('draws the round in focus and the rest of the bracket after it', () => {
    const { container } = render(<Bracket stage={singleElimination(players(8))} />);
    const root = parts(container, 'root')[0];

    expect(root?.getAttribute('data-view')).toBe('paged');
    expect(root?.getAttribute('data-compact')).toBe('bracket');
    expect(titles(container)).toEqual(['Quarterfinals', 'Semifinals', 'Final']);
    expect(parts(container, 'round')[0]?.hasAttribute('data-current')).toBe(true);
    expect(parts(container, 'connectors')).toHaveLength(1);
  });

  test('stacks the focused round tightly once earlier rounds are paged past', () => {
    const { container } = render(<Bracket stage={singleElimination(players(8))} />);
    fireEvent.click(screen.getByRole('button', { name: 'Semifinals' }));
    const rows = [...parts(container, 'cell')].map((cell) => (cell as HTMLElement).style.gridRow);

    expect(titles(container)).toEqual(['Semifinals', 'Final']);
    expect(rows).toEqual(['1 / span 2', '3 / span 2', '2 / span 2']);
  });

  test('moves between rounds with the pagination and arrow keys', () => {
    const { container } = render(<Bracket stage={singleElimination(players(8))} />);
    const current = () => titles(container)[0];

    fireEvent.click(screen.getByRole('button', { name: 'Final' }));
    expect(current()).toBe('Final');

    fireEvent.click(screen.getByRole('button', { name: 'Previous round' }));
    expect(current()).toBe('Semifinals');

    fireEvent.keyDown(parts(container, 'viewport')[0] as HTMLElement, { key: 'ArrowLeft' });
    expect(current()).toBe('Quarterfinals');
    expect(
      (screen.getByRole('button', { name: 'Previous round' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  test('can show plain lists of matches instead', () => {
    const { container } = render(<Bracket stage={singleElimination(players(8))} compact="list" />);
    const rounds = [...parts(container, 'round')];

    expect(rounds.map((round) => round.hasAttribute('data-current'))).toEqual([true, false, false]);
    expect(rounds.map((round) => round.getAttribute('aria-hidden'))).toEqual([
      null,
      'true',
      'true',
    ]);
    expect(parts(container, 'connectors')).toHaveLength(0);
  });
});

test('renders on the server', () => {
  const html = renderToString(
    <Bracket stage={singleElimination(players(4), { thirdPlace: true })} />,
  );

  expect(html).toContain('data-part="match"');
  expect(html).toContain('Third place');
});

test('composes custom parts', () => {
  const { container } = render(
    <Bracket.Root stage={singleElimination(players(4))} compactBelow={0} dir="rtl">
      <Bracket.Viewport>
        <Bracket.Rounds>
          {(column) => (
            <Bracket.Round className={(state) => (state.side === 'start' ? 'left' : undefined)}>
              <Bracket.RoundTitle>{column.round.name.toUpperCase()}</Bracket.RoundTitle>
              <Bracket.Matches>
                {() => (
                  <Bracket.Match>
                    <Bracket.Participant slot={0}>
                      {(state) => state.participant?.name}
                    </Bracket.Participant>
                  </Bracket.Match>
                )}
              </Bracket.Matches>
            </Bracket.Round>
          )}
        </Bracket.Rounds>
      </Bracket.Viewport>
    </Bracket.Root>,
  );

  expect(container.firstElementChild?.getAttribute('dir')).toBe('rtl');
  expect(screen.getByText('SEMIFINALS')).toBeDefined();
  expect(container.querySelectorAll('.left')).toHaveLength(2);
  expect(parts(container, 'participant')).toHaveLength(3);
});

test('renders every group of a double elimination stage', () => {
  const { container } = render(<Bracket stage={doubleElimination(players(8))} compactBelow={0} />);

  expect(parts(container, 'root')).toHaveLength(2);
  expect([...parts(container, 'round-title')].map((title) => title.textContent)).toContain(
    'Grand final',
  );
  expect([...parts(container, 'group-title')].map((title) => title.textContent)).toEqual([
    'Winners bracket',
    'Losers bracket',
  ]);
  expect(
    container.querySelectorAll('[data-part="cell"][data-status="waiting"]').length,
  ).toBeGreaterThan(0);
});

describe('scaled viewports', () => {
  test('pan-zoom adds zoom controls', () => {
    const { container } = render(
      <Bracket stage={singleElimination(players(8))} compactBelow={0} mode="pan-zoom" />,
    );

    expect(parts(container, 'viewport')[0]?.getAttribute('data-mode')).toBe('pan-zoom');
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Fit to view' })).toBeDefined();
  });

  test('fit scales without controls', () => {
    const { container } = render(
      <Bracket stage={singleElimination(players(8))} compactBelow={0} mode="fit" />,
    );

    expect(parts(container, 'zoom-controls')).toHaveLength(0);
    expect((parts(container, 'content')[0] as HTMLElement).style.transform).toContain('scale(');
  });
});

describe('control and motion', () => {
  test('follows a controlled page and reports changes', () => {
    const onPageChange = mock();
    const stage = singleElimination(players(8));
    const { container, rerender } = render(
      <Bracket stage={stage} page={1} onPageChange={onPageChange} />,
    );
    const first = () => parts(container, 'round-title')[0]?.textContent;

    expect(first()).toBe('Semifinals');
    fireEvent.click(screen.getByRole('button', { name: 'Final' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(first()).toBe('Semifinals');

    rerender(<Bracket stage={stage} page={2} onPageChange={onPageChange} />);
    expect(first()).toBe('Final');
  });

  test('highlights a controlled participant', () => {
    const stage = reportResult(singleElimination(players(4)), 'main.r1.m1', { scores: [2, 1] });
    const { container } = render(<Bracket stage={stage} compactBelow={0} highlighted="p1" />);

    expect(container.querySelectorAll('[data-part="participant"][data-highlighted]')).toHaveLength(
      2,
    );
  });

  test('hides byes and their lines', () => {
    const { container } = render(
      <Bracket stage={singleElimination(players(3))} compactBelow={0} hideByes />,
    );
    const hidden = [...parts(container, 'cell')].filter((cell) => (cell as HTMLElement).hidden);

    expect(hidden).toHaveLength(1);
  });

  test('flags a match whose result just changed', async () => {
    const stage = singleElimination(players(4));
    const { container, rerender } = render(<Bracket stage={stage} compactBelow={0} />);
    expect(container.querySelector('[data-updated]')).toBeNull();

    rerender(
      <Bracket stage={reportResult(stage, 'main.r1.m1', { scores: [1, 0] })} compactBelow={0} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.querySelectorAll('[data-part="match"][data-updated]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-part="participant"][data-entered]')).toHaveLength(1);
  });

  test('turns animation flags off with motion={false}', async () => {
    const stage = singleElimination(players(4));
    const { container, rerender } = render(
      <Bracket stage={stage} compactBelow={0} motion={false} />,
    );
    rerender(
      <Bracket
        stage={reportResult(stage, 'main.r1.m1', { scores: [1, 0] })}
        compactBelow={0}
        motion={false}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.querySelector('[data-updated]')).toBeNull();
  });
});

test('marks an unstyled bracket for the theme to skip', () => {
  const { container } = render(<Bracket stage={singleElimination(players(2))} unstyled />);
  expect(parts(container, 'root')[0]?.hasAttribute('data-unstyled')).toBe(true);
});
