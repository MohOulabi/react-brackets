import { reportResult, singleElimination } from '@react-brackets/core';
import { Bracket } from 'react-brackets';

// Server components build the stage with @react-brackets/core; <Bracket> runs on the client.
const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens'];

export default function Page() {
  const stage = reportResult(
    singleElimination(teams.map((name) => ({ id: name, name }))),
    'main.r1.m2',
    { scores: [2, 0] },
  );

  return <Bracket stage={stage} connectorRadius={8} />;
}
