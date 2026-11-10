import { Bracket, doubleElimination, reportResult, type Stage } from '@react-brackets/native';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = (
  [
    ['main.wb.r1.m1', [2, 0]],
    ['main.wb.r1.m2', [1, 2]],
    ['main.wb.r1.m3', [2, 1]],
    ['main.wb.r1.m4', [0, 2]],
    ['main.wb.r2.m1', [2, 1]],
    ['main.lb.r1.m1', [2, 0]],
    ['main.lb.r1.m2', [1, 2]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  doubleElimination(teams.map((name) => ({ id: name, name }))),
);

export default function DoubleElimination() {
  // Every group of the stage, each swiped on its own: the winners bracket runs into the grand final.
  return <Bracket stage={stage} />;
}
