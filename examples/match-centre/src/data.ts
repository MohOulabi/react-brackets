import { reportResult, type Stage, singleElimination } from 'react-brackets';

export interface Nation {
  id: string;
  name: string;
  flag: string;
  seed: number;
}

export const nations: Nation[] = [
  { id: 'bra', name: 'Brazil', flag: '🇧🇷', seed: 1 },
  { id: 'arg', name: 'Argentina', flag: '🇦🇷', seed: 2 },
  { id: 'esp', name: 'Spain', flag: '🇪🇸', seed: 3 },
  { id: 'fra', name: 'France', flag: '🇫🇷', seed: 4 },
  { id: 'jpn', name: 'Japan', flag: '🇯🇵', seed: 5 },
  { id: 'por', name: 'Portugal', flag: '🇵🇹', seed: 6 },
  { id: 'ned', name: 'Netherlands', flag: '🇳🇱', seed: 7 },
  { id: 'mar', name: 'Morocco', flag: '🇲🇦', seed: 8 },
];

export const nationById = new Map(nations.map((nation) => [nation.id, nation]));

/** Listed by seed, so the top seeds meet as late as possible. */
export const draw = singleElimination(nations.map(({ id, name }) => ({ id, name })));

export interface Fixture {
  day: string;
  time: string;
  venue: string;
  stats?: { possession: [number, number]; shots: [number, number]; onTarget: [number, number] };
  goals?: { side: 0 | 1; player: string; minute: number }[];
}

export const fixtures: Record<string, Fixture> = {
  'main.r1.m1': {
    day: 'Fri 3 Jul',
    time: '18:00',
    venue: 'Harbour Stadium',
    stats: { possession: [61, 39], shots: [17, 7], onTarget: [7, 3] },
    goals: [
      { side: 0, player: 'Rocha', minute: 23 },
      { side: 1, player: 'Benali', minute: 51 },
      { side: 0, player: 'Lima', minute: 88 },
    ],
  },
  'main.r1.m2': {
    day: 'Fri 3 Jul',
    time: '21:00',
    venue: 'Northgate Park',
    stats: { possession: [57, 43], shots: [12, 11], onTarget: [4, 5] },
    goals: [
      { side: 0, player: 'Martin', minute: 12 },
      { side: 1, player: 'Sato', minute: 64 },
      { side: 1, player: 'Ueda', minute: 79 },
    ],
  },
  'main.r1.m3': {
    day: 'Sat 4 Jul',
    time: '18:00',
    venue: 'River Arena',
    stats: { possession: [54, 46], shots: [15, 9], onTarget: [8, 2] },
    goals: [
      { side: 0, player: 'Ríos', minute: 9 },
      { side: 1, player: 'de Groot', minute: 33 },
      { side: 0, player: 'Ríos', minute: 58 },
      { side: 0, player: 'Paz', minute: 90 },
    ],
  },
  'main.r1.m4': {
    day: 'Sat 4 Jul',
    time: '21:00',
    venue: 'Old Town Ground',
    stats: { possession: [66, 34], shots: [14, 6], onTarget: [5, 2] },
    goals: [{ side: 0, player: 'Navarro', minute: 71 }],
  },
  'main.r2.m1': {
    day: 'Tue 7 Jul',
    time: '20:00',
    venue: 'Harbour Stadium',
    stats: { possession: [52, 48], shots: [9, 8], onTarget: [3, 4] },
    goals: [
      { side: 1, player: 'Sato', minute: 27 },
      { side: 0, player: 'Rocha', minute: 55 },
    ],
  },
  'main.r2.m2': {
    day: 'Wed 8 Jul',
    time: '20:00',
    venue: 'Northgate Park',
    stats: { possession: [47, 53], shots: [11, 13], onTarget: [6, 4] },
    goals: [
      { side: 1, player: 'Navarro', minute: 18 },
      { side: 0, player: 'Paz', minute: 40 },
      { side: 0, player: 'Ríos', minute: 82 },
    ],
  },
  'main.r3.m1': { day: 'Sun 12 Jul', time: '19:00', venue: 'Harbour Stadium' },
};

/** Results in the order they came in. The last one is still being played. */
export const results: { match: string; scores: [number, number]; live?: boolean }[] = [
  { match: 'main.r1.m1', scores: [2, 1] },
  { match: 'main.r1.m2', scores: [1, 2] },
  { match: 'main.r1.m3', scores: [3, 1] },
  { match: 'main.r1.m4', scores: [1, 0] },
  { match: 'main.r2.m2', scores: [2, 1] },
  { match: 'main.r2.m1', scores: [1, 1], live: true },
];

/** The draw after the first `count` results. */
export function play(count: number): Stage {
  return results
    .slice(0, count)
    .reduce((stage, { match, scores, live }) => reportResult(stage, match, { scores, live }), draw);
}
