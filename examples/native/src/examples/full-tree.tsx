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
  'Sharks',
  'Owls',
  'Moose',
  'Vipers',
];

const stage = Array.from({ length: 8 }, (_, index) => `main.r1.m${index + 1}`).reduce<Stage>(
  (current, match, index) => reportResult(current, match, { scores: index % 3 ? [2, 1] : [0, 2] }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

export default function FullTree() {
  // compactBelow={0} keeps the whole tree on a phone; pinch, drag or double tap to explore it.
  return <Bracket stage={stage} compactBelow={0} mode="pan-zoom" />;
}
