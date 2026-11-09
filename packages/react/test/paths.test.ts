import { expect, test } from 'bun:test';
import { rubberBand } from '../src/hooks/use-swipe';
import { connectorPath } from '../src/paths';

test('draws a straight line between level boxes', () => {
  expect(connectorPath({ x: 0, y: 10 }, { x: 40, y: 10 })).toBe('M0,10H40');
});

test('turns halfway between columns', () => {
  expect(connectorPath({ x: 0, y: 0 }, { x: 40, y: 30 })).toBe('M0,0H20V30H40');
});

test('rounds the corners within the available space', () => {
  expect(connectorPath({ x: 0, y: 0 }, { x: 40, y: 30 }, 6)).toBe(
    'M0,0H14Q20,0 20,6V24Q20,30 26,30H40',
  );
  expect(connectorPath({ x: 0, y: 0 }, { x: 40, y: 4 }, 6)).toBe(
    'M0,0H18Q20,0 20,2V2Q20,4 22,4H40',
  );
});

test('works right to left', () => {
  expect(connectorPath({ x: 40, y: 30 }, { x: 0, y: 0 })).toBe('M40,30H20V0H0');
});

test('rubber band resists more the further it is pulled', () => {
  const near = rubberBand(50, 300);
  const far = rubberBand(300, 300);

  expect(near).toBeLessThan(50);
  expect(far).toBeLessThan(120);
  expect(rubberBand(-300, 300)).toBe(-far);
});
