import { Bracket, reportResult, type Stage, singleElimination } from '@react-brackets/native';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

// The quarterfinals are played and the first semifinal is done.
const results: [string, [number, number]][] = [
  ['main.r1.m1', [3, 1]],
  ['main.r1.m2', [0, 2]],
  ['main.r1.m3', [2, 1]],
  ['main.r1.m4', [1, 3]],
  ['main.r2.m1', [2, 0]],
];

const stage = results.reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

export default function QuickStart() {
  return <Bracket stage={stage} />;
}
