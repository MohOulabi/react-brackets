import { useState } from 'react';
import {
  allMatches,
  Bracket,
  qualifiers,
  reportResult,
  roundRobin,
  type Stage,
  singleElimination,
} from 'react-brackets';
import styles from './app.module.css';
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
  const [view, setView] = useState<'groups' | 'playoffs'>('groups');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Regional Cup</h2>
          <p className={styles.meta}>The top two in each group go through to the semifinals.</p>
        </div>
        <fieldset className={styles.switch} aria-label="Stage">
          <button type="button" aria-pressed={view === 'groups'} onClick={() => setView('groups')}>
            Groups
          </button>
          <button
            type="button"
            aria-pressed={view === 'playoffs'}
            onClick={() => setView('playoffs')}
          >
            Playoffs
          </button>
        </fieldset>
      </header>
      {view === 'groups' ? (
        <div className={styles.groups}>
          {groups.groups.map((group) => (
            <section key={group.id} className={styles.group}>
              <h3>{group.name}</h3>
              <StandingsTable stage={groups} groupId={group.id} className={styles.standings} />
            </section>
          ))}
        </div>
      ) : (
        <Bracket stage={playoffs} connectorRadius={8} />
      )}
    </div>
  );
}
