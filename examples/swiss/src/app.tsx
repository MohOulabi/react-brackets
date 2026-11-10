import { useState } from 'react';
import {
  allMatches,
  Bracket,
  nextSwissRound,
  reportResult,
  type Stage,
  swiss,
  swissRoundsLeft,
} from 'react-brackets';
import styles from './app.module.css';
import { StandingsTable } from './standings-table';

const players = ['Ana', 'Ben', 'Chloe', 'Dev', 'Eli', 'Farah', 'Gus', 'Hana', 'Ivo'];

const start = swiss(players.map((name) => ({ id: name, name })));

const simulate = (stage: Stage): Stage =>
  allMatches(stage)
    .filter((match) => match.status === 'ready')
    .reduce(
      (current, match) =>
        reportResult(current, match.id, { scores: Math.random() < 0.5 ? [1, 0] : [0, 1] }),
      stage,
    );

export function App() {
  const [stage, setStage] = useState(start);
  const round = stage.groups[0]?.rounds.length ?? 0;
  const roundOpen = allMatches(stage).some((match) => match.status === 'ready');
  const left = swissRoundsLeft(stage);
  const finished = !roundOpen && left === 0;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Club Rapid</h2>
          <p className={styles.meta}>
            {finished
              ? 'All rounds played.'
              : `Round ${round} of ${round + left}. Players on the same score meet next.`}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            disabled={finished}
            onClick={() => setStage(roundOpen ? simulate(stage) : nextSwissRound(stage))}
          >
            {finished ? 'Finished' : roundOpen ? `Play round ${round}` : `Pair round ${round + 1}`}
          </button>
          <button type="button" className={styles.button} onClick={() => setStage(start)}>
            Reset
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <StandingsTable stage={stage} className={styles.standings} />
        <Bracket stage={stage} labels={{ bye: 'Bye' }} />
      </div>
    </div>
  );
}
