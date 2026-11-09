import {
  allMatches,
  Bracket,
  qualifiers,
  reportResult,
  roundRobin,
  type Stage,
  singleElimination,
} from 'react-brackets';
import { StandingsTable } from './standings-table';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const draw = roundRobin(
  teams.map((name) => ({ id: name, name })),
  { groups: 2 },
);

const groups = allMatches(draw).reduce<Stage>(
  (current, match, index) =>
    reportResult(current, match.id, { scores: [index % 3, (index + 1) % 3] }),
  draw,
);

// Group winners meet the other group's runner-up in the semifinals.
const playoffs = singleElimination(qualifiers(groups, 2), { id: 'playoffs', thirdPlace: true });

export function App() {
  return (
    <div className="layout">
      {groups.groups.map((group) => (
        <section key={group.id}>
          <h2>{group.name}</h2>
          <StandingsTable stage={groups} groupId={group.id} />
        </section>
      ))}
      <section>
        <h2>Playoffs</h2>
        <Bracket stage={playoffs} />
      </section>
    </div>
  );
}
