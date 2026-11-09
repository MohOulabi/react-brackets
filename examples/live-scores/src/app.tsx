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

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];
const target = 5;

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
  const [stage, setStage] = useState(() =>
    singleElimination(teams.map((name) => ({ id: name, name }))),
  );
  const [selected, setSelected] = useState<Match | null>(null);
  const names = participantMap(stage);

  useEffect(() => {
    const timer = setInterval(() => setStage(tick), 700);
    return () => clearInterval(timer);
  }, []);

  const current = selected && allMatches(stage).find((match) => match.id === selected.id);

  return (
    <main className="stack">
      <Bracket stage={stage} connectorRadius={8} onMatchClick={setSelected} />
      <p className="detail">
        {current
          ? `${current.slots.map((slot) => names.get(slot.participantId ?? '')?.name ?? 'TBD').join(' vs ')} · ${current.status}`
          : `First to ${target}. Click a match to follow it.`}
      </p>
    </main>
  );
}
