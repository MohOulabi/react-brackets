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
import { StandingsTable } from './standings-table';

const players = ['Ana', 'Ben', 'Chloe', 'Dev', 'Eli', 'Farah', 'Gus', 'Hana', 'Ivo'];

const simulate = (stage: Stage): Stage =>
  allMatches(stage)
    .filter((match) => match.status === 'ready')
    .reduce(
      (current, match) =>
        reportResult(current, match.id, { scores: Math.random() < 0.5 ? [1, 0] : [0, 1] }),
      stage,
    );

export function App() {
  const [stage, setStage] = useState(() => swiss(players.map((name) => ({ id: name, name }))));
  const roundOpen = allMatches(stage).some((match) => match.status === 'ready');
  const finished = !roundOpen && swissRoundsLeft(stage) === 0;

  return (
    <div className="layout">
      <div>
        <button
          type="button"
          disabled={finished}
          onClick={() => setStage(roundOpen ? simulate(stage) : nextSwissRound(stage))}
        >
          {finished ? 'Finished' : roundOpen ? 'Play this round' : 'Pair next round'}
        </button>
      </div>
      <StandingsTable stage={stage} />
      <Bracket stage={stage} labels={{ bye: 'Bye' }} />
    </div>
  );
}
