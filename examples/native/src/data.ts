import { reportResult, type Stage, singleElimination } from '@react-brackets/native';

export const teams = [
  'Falcons',
  'Wolves',
  'Herons',
  'Lynx',
  'Orcas',
  'Ravens',
  'Bison',
  'Cobras',
  'Hawks',
  'Otters',
  'Cranes',
  'Pumas',
  'Sharks',
  'Owls',
  'Moose',
  'Vipers',
];

/** Sixteen teams, the first round played and a quarterfinal under way. */
export const cup: Stage = [
  ...Array.from({ length: 8 }, (_, index) => ({
    match: `main.r1.m${index + 1}`,
    scores: (index % 3 ? [2, 1] : [0, 2]) as [number, number],
    live: false,
  })),
  { match: 'main.r2.m1', scores: [1, 0] as [number, number], live: false },
  { match: 'main.r2.m2', scores: [1, 1] as [number, number], live: true },
].reduce<Stage>(
  (stage, { match, scores, live }) => reportResult(stage, match, { scores, live }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);
