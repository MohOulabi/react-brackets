import { Bracket, singleElimination } from 'react-brackets';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = singleElimination(teams.map((name) => ({ id: name, name })));

export function App() {
  return <Bracket stage={stage} />;
}
