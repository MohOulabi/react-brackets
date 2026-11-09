import { Bracket, reportResult, type Stage, singleElimination } from 'react-brackets';

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

const firstRound = Array.from({ length: 8 }, (_, index) => `main.r1.m${index + 1}`);

const stage = firstRound.reduce<Stage>(
  (current, matchId, index) =>
    reportResult(current, matchId, { scores: index % 3 ? [2, 1] : [0, 2] }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

export function App() {
  return <Bracket stage={stage} layout="mirrored" connectorRadius={8} className="compact" />;
}
