import { Bracket, reportResult, type Stage, singleElimination } from '@react-brackets/native';
import type { ReactNode } from 'react';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = (
  [
    ['main.r1.m1', [3, 1]],
    ['main.r1.m2', [0, 2]],
    ['main.r1.m3', [2, 1]],
    ['main.r1.m4', [1, 3]],
    ['main.r2.m1', [2, 0]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

export default function TwoSided(): ReactNode {
  // The halves meet at the final in the middle. Mirroring is for the whole tree, so it stays whole on a
  // phone too, scrolled sideways at full size.
  return (
    <Bracket
      stage={stage}
      layout="mirrored"
      compactBelow={0}
      theme={{ matchWidth: 150, columnGap: 28 }}
    />
  );
}
