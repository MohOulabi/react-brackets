export interface Point {
  x: number;
  y: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** An elbow from `from` to `to` that turns halfway, with optional rounded corners. */
export function connectorPath(from: Point, to: Point, radius = 0): string {
  const midX = round((from.x + to.x) / 2);
  const dy = to.y - from.y;
  if (Math.abs(dy) < 1) return `M${round(from.x)},${round(from.y)}H${round(to.x)}`;

  const corner = Math.min(radius, Math.abs(dy) / 2, Math.abs(midX - from.x));
  if (corner <= 0) {
    return `M${round(from.x)},${round(from.y)}H${midX}V${round(to.y)}H${round(to.x)}`;
  }

  const sx = Math.sign(to.x - from.x);
  const sy = Math.sign(dy);
  return [
    `M${round(from.x)},${round(from.y)}`,
    `H${round(midX - sx * corner)}`,
    `Q${midX},${round(from.y)} ${midX},${round(from.y + sy * corner)}`,
    `V${round(to.y - sy * corner)}`,
    `Q${midX},${round(to.y)} ${round(midX + sx * corner)},${round(to.y)}`,
    `H${round(to.x)}`,
  ].join('');
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Exit and entry points between two boxes, whichever side they face each other on. */
export function anchors(from: Box, to: Box): [Point, Point] {
  const forward = from.left + from.width / 2 < to.left + to.width / 2;
  return [
    { x: forward ? from.left + from.width : from.left, y: from.top + from.height / 2 },
    { x: forward ? to.left : to.left + to.width, y: to.top + to.height / 2 },
  ];
}

/**
 * The element's layout box relative to `container`. Offsets ignore transforms,
 * so animations and zoom never skew the result.
 */
export function boxWithin(element: HTMLElement, container: HTMLElement): Box {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = element;
  while (node && node !== container) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top, width: element.offsetWidth, height: element.offsetHeight };
}
