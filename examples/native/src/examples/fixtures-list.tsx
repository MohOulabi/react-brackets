import { Bracket, reportResult, type Stage, singleElimination } from '@react-brackets/native';

const teams = [
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
];

// Twelve teams: the top four seeds get a bye into the second round.
const stage = (
  [
    ['main.r1.m2', [2, 1]],
    ['main.r1.m4', [0, 1]],
    ['main.r1.m6', [3, 2]],
    ['main.r1.m8', [1, 2]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

export default function FixturesList() {
  // Each round as a plain list of matches, swiped one round at a time.
  return <Bracket stage={stage} compact="list" />;
}
