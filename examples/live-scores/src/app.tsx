import { useEffect, useState } from 'react';
import {
  allMatches,
  Bracket,
  type Match,
  participantMap,
  reportResult,
  type Stage,
  singleElimination,
} from 'react-brackets';
import styles from './app.module.css';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];
const target = 5;

const start = singleElimination(teams.map((name) => ({ id: name, name })));

/** One scoring event per tick: a live match gains a point, or the next ready match kicks off. */
function tick(stage: Stage): Stage {
  const live = allMatches(stage).find((match) => match.status === 'live');
  if (!live) {
    const next = allMatches(stage).find((match) => match.status === 'ready');
    return next ? reportResult(stage, next.id, { scores: [0, 0], live: true }) : stage;
  }

  const side = Math.random() < 0.5 ? 0 : 1;
  const scores: [number, number] = [live.slots[0].score ?? 0, live.slots[1].score ?? 0];
  scores[side] += 1;
  return reportResult(stage, live.id, { scores, live: scores[side] < target });
}

export function App() {
  const [stage, setStage] = useState(start);
  const [playing, setPlaying] = useState(true);
  const [followed, setFollowed] = useState<string | null>(null);
  const names = participantMap(stage);
  const matches = allMatches(stage);
  const live = matches.find((match) => match.status === 'live');
  const finished = !live && !matches.some((match) => match.status === 'ready');
  const shown = matches.find((match) => match.id === followed) ?? live;

  useEffect(() => {
    if (!playing || finished) return;
    const timer = setInterval(() => setStage(tick), 700);
    return () => clearInterval(timer);
  }, [playing, finished]);

  const score = (match: Match) =>
    match.slots
      .map((slot) => `${names.get(slot.participantId ?? '')?.name ?? 'TBD'} ${slot.score ?? 0}`)
      .join(' – ');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>
            Weekend Cup
            {live && <span className={styles.live}>Live</span>}
          </h2>
          <p className={styles.meta} aria-live="polite">
            {finished
              ? 'All matches played.'
              : shown
                ? `${followed ? 'Following' : 'Now'}: ${score(shown)}`
                : `First to ${target}. Click a match to follow it.`}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            disabled={finished}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setStage(start);
              setFollowed(null);
              setPlaying(true);
            }}
          >
            Restart
          </button>
        </div>
      </header>
      <Bracket
        stage={stage}
        connectorRadius={8}
        className={styles.bracket}
        onMatchClick={(match) => setFollowed(match.id === followed ? null : match.id)}
      />
    </div>
  );
}
