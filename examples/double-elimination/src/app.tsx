import { useState } from 'react';
import { Bracket, doubleElimination, reportResult, type Stage } from 'react-brackets';
import styles from './app.module.css';

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

// The grand final continues the winners bracket, so they share a tab.
const winners = { label: 'Winners and final', groups: ['main.wb', 'main.gf'] };
const losers = { label: 'Losers', groups: ['main.lb'] };

export function App() {
  const [view, setView] = useState(winners);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Harbour Invitational</h2>
          <p className={styles.meta}>Double elimination. A team is out after its second loss.</p>
        </div>
        <fieldset className={styles.switch} aria-label="Bracket">
          {[winners, losers].map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={option === view}
              onClick={() => setView(option)}
            >
              {option.label}
            </button>
          ))}
        </fieldset>
      </header>
      <Bracket.Root key={view.label} stage={stage} group={view.groups}>
        <Bracket.Viewport>
          <Bracket.Rounds />
          <Bracket.Connectors radius={8} />
        </Bracket.Viewport>
        <Bracket.Pagination />
      </Bracket.Root>
    </div>
  );
}
