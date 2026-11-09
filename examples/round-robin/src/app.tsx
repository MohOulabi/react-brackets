import { allMatches, Bracket, reportResult, roundRobin, type Stage } from 'react-brackets';
import { StandingsTable } from './standings-table';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens'];

const scoreFor = (index: number): [number, number] => [index % 3, (index * 2) % 3];

const initial = roundRobin(teams.map((name) => ({ id: name, name })));

// Play the first three rounds so the table has something to show.
const stage = allMatches(initial)
  .slice(0, 9)
  .reduce<Stage>(
    (current, match, index) => reportResult(current, match.id, { scores: scoreFor(index) }),
    initial,
  );

export function App() {
  return (
    <div className="layout">
      <StandingsTable stage={stage} />
      <Bracket stage={stage} />
    </div>
  );
}
