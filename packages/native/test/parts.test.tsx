import { afterEach, describe, expect, test } from 'bun:test';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  Bracket,
  lightTheme,
  type PaginationState,
  type RoundTitleState,
  usePagination,
} from '../src';
import { drawn, eight } from './render';
import { gestures } from './setup';

afterEach(cleanup);

/** A title for the round in focus, outside the bracket. */
function Header() {
  const { rounds, page } = usePagination();
  const round = rounds[page];
  return round ? <Bracket.RoundTitle round={round} /> : null;
}

/** What the last `Spy` saw from `usePagination`. */
const seen: { pagination?: PaginationState } = {};
function Spy() {
  seen.pagination = usePagination();
  return null;
}

function Controlled() {
  const [page, setPage] = useState(0);
  return (
    <Bracket.Root stage={eight} page={page} onPageChange={setPage}>
      <Bracket.Viewport />
      <Spy />
    </Bracket.Root>
  );
}

describe('Bracket.RoundTitle', () => {
  test('draws itself inside renderRoundTitle instead of calling it again', () => {
    let calls = 0;
    render(
      <Bracket
        stage={eight}
        renderRoundTitle={(round) => {
          calls += 1;
          return (
            <View>
              <Bracket.RoundTitle round={round} />
              <Text>{`${round.matches.length} matches`}</Text>
            </View>
          );
        }}
      />,
    );
    expect(calls).toBeLessThan(10);
    expect(screen.getAllByText('Quarterfinals').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4 matches').length).toBeGreaterThan(0);
  });

  test('takes a style and children as functions of its state', () => {
    const states: RoundTitleState[] = [];
    render(
      <Bracket
        stage={eight}
        renderRoundTitle={(round) => (
          <Bracket.RoundTitle
            round={round}
            style={({ current }) => ({ color: current ? 'red' : 'gray' })}
          />
        )}
      />,
    );
    const titles = drawn(document.body).filter(
      ({ element }) => element.getAttribute('role') === 'header',
    );
    expect(titles.find(({ element }) => element.textContent === 'Quarterfinals')?.style.color).toBe(
      'red',
    );
    expect(titles.find(({ element }) => element.textContent === 'Final')?.style.color).toBe('gray');
    cleanup();

    render(
      <Bracket
        stage={eight}
        renderRoundTitle={(round) => (
          <Bracket.RoundTitle round={round}>
            {(state) => {
              states.push(state);
              return <Text>{`${state.index + 1}. ${state.round.name}`}</Text>;
            }}
          </Bracket.RoundTitle>
        )}
      />,
    );
    expect(screen.getAllByText('3. Final').length).toBeGreaterThan(0);
    expect(states.find((state) => state.index === 0)?.current).toBe(true);
  });

  test('on its own, draws your renderRoundTitle', () => {
    render(
      <Bracket.Root stage={eight} renderRoundTitle={(round) => <Text>{`Now: ${round.name}`}</Text>}>
        <Header />
      </Bracket.Root>,
    );
    expect(screen.getByText('Now: Quarterfinals')).toBeTruthy();
  });
});

describe('a pressable match', () => {
  const pressed = lightTheme.colors.surfacePressed;
  const card = () =>
    drawn(document.body).find(({ style }) => style.borderRadius === lightTheme.radius);

  test('colours its card with surfacePressed while pressed, without fading', () => {
    render(<Bracket stage={eight} onMatchPress={() => {}} />);
    const button = screen.getAllByRole('button')[0];
    expect(card()?.style.backgroundColor).toBe(lightTheme.colors.surface);
    if (button) fireEvent.mouseDown(button);
    expect(card()?.style.backgroundColor).toBe(pressed);
    const fades = drawn(document.body).filter(({ style }) => style.opacity === 0.7);
    expect(fades.length).toBe(0);
  });

  test('tells a style function it is pressed', () => {
    render(
      <Bracket
        stage={eight}
        onMatchPress={() => {}}
        renderMatch={() => (
          <Bracket.Match style={({ pressed: down }) => ({ borderColor: down ? 'red' : 'gray' })} />
        )}
      />,
    );
    const button = screen.getAllByRole('button')[0];
    if (button) fireEvent.mouseDown(button);
    expect(drawn(document.body).filter(({ style }) => style.borderColor === 'red').length).toBe(1);
  });

  test('fades a card drawn without Bracket.Match, which it cannot colour', () => {
    render(
      <Bracket
        stage={eight}
        onMatchPress={() => {}}
        renderMatch={(match) => <Text>{match.id}</Text>}
      />,
    );
    const button = screen.getAllByRole('button')[0];
    if (button) fireEvent.mouseDown(button);
    expect(drawn(document.body).filter(({ style }) => style.opacity === 0.7).length).toBe(1);
  });
});

describe('style functions', () => {
  test('Bracket.Pagination and Bracket.PageIndicator get the page', () => {
    render(
      <Bracket.Root stage={eight} page={1}>
        <Bracket.Viewport />
        <Bracket.Pagination style={({ page }) => ({ marginTop: page * 10 })}>
          <Bracket.PageIndicator style={({ page }) => ({ marginLeft: page * 5 })} />
        </Bracket.Pagination>
      </Bracket.Root>,
    );
    const styles = drawn(document.body).map(({ style }) => style);
    expect(styles.some((style) => style.marginTop === 10)).toBe(true);
    expect(styles.some((style) => style.marginLeft === 5)).toBe(true);
  });

  test('Bracket.ZoomControls gets what its buttons can do', () => {
    render(
      <Bracket.Root stage={eight} compactBelow={0}>
        <Bracket.Viewport mode="pan-zoom" controls={false} />
        <Bracket.ZoomControls
          style={({ canZoomIn, canZoomOut }) => ({ marginTop: canZoomIn && !canZoomOut ? 7 : 0 })}
        />
      </Bracket.Root>,
    );
    expect(drawn(document.body).some(({ style }) => style.marginTop === 7)).toBe(true);
  });
});

describe('usePagination', () => {
  test('says whether the bracket is paging', () => {
    render(
      <Bracket.Root stage={eight}>
        <Spy />
      </Bracket.Root>,
    );
    expect(seen.pagination?.paged).toBe(true);
    cleanup();
    render(
      <Bracket.Root stage={eight} compactBelow={0}>
        <Spy />
      </Bracket.Root>,
    );
    expect(seen.pagination?.paged).toBe(false);
  });

  const swipe = () =>
    act(() => {
      gestures.pan?.onActivate?.();
      gestures.pan?.onUpdate?.({ translationX: -250 });
      gestures.pan?.onDeactivate?.({ velocityX: -400 });
    });

  test('a controlled page without onPageChange holds, after a swipe or a tab', () => {
    render(
      <Bracket.Root stage={eight} page={0}>
        <Bracket.Viewport />
        <Bracket.Pagination />
        <Spy />
      </Bracket.Root>,
    );
    swipe();
    expect(seen.pagination?.page).toBe(0);
    expect(seen.pagination?.position.value).toBe(0);

    const tab = screen.getAllByRole('tab')[1];
    if (tab) fireEvent.click(tab);
    expect(seen.pagination?.page).toBe(0);
    expect(seen.pagination?.position.value).toBe(0);
  });

  test('a controlled page moves when onPageChange sets it', () => {
    render(<Controlled />);
    swipe();
    expect(seen.pagination?.page).toBe(1);
    expect(seen.pagination?.position.value).toBe(1);
  });

  test('a controlled page goes back when onPageChange turns the change down', () => {
    render(
      <Bracket.Root stage={eight} page={0} onPageChange={() => {}}>
        <Bracket.Viewport />
        <Spy />
      </Bracket.Root>,
    );
    swipe();
    expect(seen.pagination?.position.value).toBe(0);
  });

  test('an uncontrolled page follows a swipe', () => {
    render(
      <Bracket.Root stage={eight}>
        <Bracket.Viewport />
        <Spy />
      </Bracket.Root>,
    );
    swipe();
    expect(seen.pagination?.page).toBe(1);
    expect(seen.pagination?.position.value).toBe(1);
  });
});
