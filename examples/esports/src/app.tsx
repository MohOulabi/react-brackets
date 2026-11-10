import { FastForward, RotateCcw, Trophy } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';
import {
  allMatches,
  Bracket,
  getMatch,
  reportResult,
  type Stage,
  singleElimination,
} from 'react-brackets';
import styles from './app.module.css';
import { SeriesCard } from './series-card';
import { teamById, teams } from './teams';

const start = singleElimination(teams.map(({ id, name }) => ({ id, name })));

/** Plays one map of a series. The better seed is a little more likely to take it. */
function playMap(stage: Stage, matchId: string): Stage {
  const match = getMatch(stage, matchId);
  const [first, second] = match.slots.map((slot) => teamById.get(slot.participantId ?? ''));
  const edge = 0.5 + ((second?.seed ?? 0) - (first?.seed ?? 0)) * 0.04;
  const scores: [number, number] = [match.slots[0].score ?? 0, match.slots[1].score ?? 0];
  scores[Math.random() < edge ? 0 : 1] += 1;
  return reportResult(stage, matchId, { scores, live: Math.max(...scores) < 2 });
}

/** Opens or closes one roster, as a new map for React state. */
function toggled(open: Map<string, Set<0 | 1>>, matchId: string, slot: 0 | 1) {
  const slots = new Set(open.get(matchId));
  if (slots.has(slot)) slots.delete(slot);
  else slots.add(slot);
  return new Map(open).set(matchId, slots);
}

export function App() {
  const [stage, setStage] = useState(start);
  const [playing, setPlaying] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [open, setOpen] = useState(() => new Map<string, Set<0 | 1>>());
  const matches = allMatches(stage);
  const final = matches.at(-1);
  const champion =
    final?.winner != null ? teamById.get(final.slots[final.winner].participantId ?? '') : undefined;

  // A series in progress: one map at a time.
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const next = playMap(stage, playing);
      setStage(next);
      if (getMatch(next, playing).status === 'completed') setPlaying(null);
    }, 900);
    return () => clearTimeout(timer);
  }, [stage, playing]);

  // Playing the whole bracket: the next series starts once one ends.
  useEffect(() => {
    if (!auto || playing) return;
    const next = matches.find((match) => match.status === 'ready');
    if (next) setPlaying(next.id);
    else setAuto(false);
  }, [auto, playing, matches]);

  const replay = () => {
    setStage(start);
    setPlaying(null);
    setAuto(false);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Rift Masters</h2>
          <p className={styles.meta}>Open a team for its roster. Play a series, or all of them.</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            disabled={auto || champion !== undefined}
            onClick={() => setAuto(true)}
          >
            <FastForward size={16} />
            Play all
          </button>
          <button type="button" className={styles.button} onClick={replay}>
            <RotateCcw size={16} />
            Replay
          </button>
        </div>
      </header>
      {champion && (
        <p className={styles.champion} style={{ '--team': champion.color } as CSSProperties}>
          <Trophy size={20} />
          <span>
            <strong>{champion.name}</strong> are the Rift Masters champions.
          </span>
        </p>
      )}
      <Bracket
        stage={stage}
        connectorRadius={10}
        className={styles.bracket}
        renderMatch={(match) => (
          <SeriesCard
            match={match}
            open={open.get(match.id) ?? new Set()}
            onToggle={(slot) => setOpen(toggled(open, match.id, slot))}
            onPlay={() => setPlaying(match.id)}
          />
        )}
      />
    </div>
  );
}
