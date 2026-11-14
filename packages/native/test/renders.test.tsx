import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { Bracket, type Match, reportResult } from '../src';
import { eight } from './render';

afterEach(cleanup);

describe('redrawing on a new result', () => {
  test('redraws only the card whose match changed', () => {
    const drawn: string[] = [];
    const renderMatch = (match: Match) => {
      drawn.push(match.id);
      return <Bracket.Match />;
    };
    const { rerender } = render(<Bracket stage={eight} renderMatch={renderMatch} />);
    expect(drawn.length).toBeGreaterThanOrEqual(7);

    drawn.length = 0;
    const next = reportResult(eight, 'main.r1.m2', { scores: [1, 0], live: true });
    rerender(<Bracket stage={next} renderMatch={renderMatch} />);
    expect(drawn.length).toBeGreaterThan(0);
    expect(new Set(drawn)).toEqual(new Set(['main.r1.m2']));
  });

  test('redraws every card when renderMatch is a new function', () => {
    const card = (label: string) => (match: Match) => <Text>{`${label} ${match.id}`}</Text>;
    const { rerender } = render(<Bracket stage={eight} renderMatch={card('a')} />);
    rerender(<Bracket stage={eight} renderMatch={card('b')} />);

    expect(screen.queryAllByText(/^a /)).toHaveLength(0);
    expect(screen.getAllByText(/^b /).length).toBeGreaterThanOrEqual(7);
  });

  test('calls the latest onMatchPress', () => {
    const first = mock();
    const second = mock();
    const { rerender } = render(<Bracket stage={eight} onMatchPress={first} />);
    rerender(<Bracket stage={eight} onMatchPress={second} />);
    const button = screen.getAllByRole('button')[0];
    if (button) fireEvent.click(button);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('applies a changed theme', () => {
    const { rerender, container } = render(
      <Bracket stage={eight} theme={{ colors: { surface: '#111111' } }} />,
    );
    rerender(<Bracket stage={eight} theme={{ colors: { surface: '#222222' } }} />);
    const styles = [...container.querySelectorAll('[data-style]')].map(
      (element) => JSON.parse(element.getAttribute('data-style') ?? '{}').backgroundColor,
    );
    expect(styles).toContain('#222222');
    expect(styles).not.toContain('#111111');
  });
});
