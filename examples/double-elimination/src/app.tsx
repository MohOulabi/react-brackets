import { Bracket, doubleElimination, reportResult, type Stage } from 'react-brackets';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const results: [string, [number, number]][] = [
  ['main.wb.r1.m1', [2, 0]],
  ['main.wb.r1.m2', [1, 2]],
  ['main.wb.r1.m3', [2, 1]],
  ['main.wb.r1.m4', [0, 2]],
  ['main.wb.r2.m1', [2, 1]],
  ['main.lb.r1.m1', [2, 0]],
  ['main.lb.r1.m2', [1, 2]],
];

const stage = results.reduce<Stage>(
  (current, [matchId, scores]) => reportResult(current, matchId, { scores }),
  doubleElimination(teams.map((name) => ({ id: name, name }))),
);

export function App() {
  return <Bracket stage={stage} connectorRadius={8} />;
}
