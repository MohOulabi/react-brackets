import { useState } from 'react';
import { allMatches, Bracket, reportResult, roundRobin, type Stage } from 'react-brackets';
import styles from './app.module.css';
import { StandingsTable } from './standings-table';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens'];

const goals = () => Math.floor(Math.random() * 4);

/** Plays every match of the first round that still has matches to play. */
function playRound(stage: Stage): Stage {
  const round = stage.groups[0]?.rounds.find((candidate) =>
    candidate.matches.some((match) => match.status === 'ready'),
  );
  return (round?.matches ?? []).reduce(
    (current, match) => reportResult(current, match.id, { scores: [goals(), goals()] }),
    stage,
  );
}

const scoreFor = (index: number): [number, number] => [index % 3, (index * 2) % 3];

const initial = roundRobin(teams.map((name) => ({ id: name, name })));

// The first two rounds are already played, so the table has something to show.
const start = allMatches(initial)
  .slice(0, 6)
  .reduce<Stage>(
    (current, match, index) => reportResult(current, match.id, { scores: scoreFor(index) }),
    initial,
  );

export function App() {
  const [stage, setStage] = useState(start);
  const [view, setView] = useState<'table' | 'matches'>('table');
  const rounds = stage.groups[0]?.rounds ?? [];
  const played = rounds.filter((round) =>
    round.matches.every((match) => match.status === 'completed'),
  ).length;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Sunday League</h2>
          <p className={styles.meta}>
            {played} of {rounds.length} rounds played. Three points for a win, one for a draw.
          </p>
        </div>
        <div className={styles.actions}>
          <fieldset className={styles.switch} aria-label="View">
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
              Table
            </button>
            <button
              type="button"
              aria-pressed={view === 'matches'}
              onClick={() => setView('matches')}
            >
              Matches
            </button>
          </fieldset>
          <button
            type="button"
            className={styles.button}
            disabled={played === rounds.length}
            onClick={() => setStage(playRound(stage))}
          >
            {played === rounds.length ? 'Season over' : `Play round ${played + 1}`}
          </button>
          <button type="button" className={styles.button} onClick={() => setStage(start)}>
            Reset
          </button>
        </div>
      </header>
      {view === 'table' ? (
        <StandingsTable stage={stage} className={styles.standings} />
      ) : (
        <Bracket stage={stage} />
      )}
    </div>
  );
}
