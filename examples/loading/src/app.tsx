import { type CSSProperties, useEffect, useState } from 'react';
import { Bracket, type Match, type Participant, singleElimination } from 'react-brackets';
import styles from './app.module.css';

const placeholders: Participant[] = Array.from({ length: 8 }, (_, index) => ({
  id: `placeholder-${index}`,
  name: '',
}));
const skeleton = singleElimination(placeholders);

function fetchTeams(): Promise<Participant[]> {
  const names = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];
  return new Promise((resolve) =>
    setTimeout(() => resolve(names.map((name) => ({ id: name, name }))), 1500),
  );
}

const looks = [
  { id: 'pulse', name: 'Pulse' },
  { id: 'shimmer', name: 'Shimmer' },
  { id: 'wave', name: 'Wave' },
] as const;

type Look = (typeof looks)[number]['id'];

export function App() {
  const [teams, setTeams] = useState<Participant[] | null>(null);
  const [request, setRequest] = useState(0);
  const [look, setLook] = useState<Look>('shimmer');

  // biome-ignore lint/correctness/useExhaustiveDependencies: each request number loads the draw again
  useEffect(() => {
    let current = true;
    setTeams(null);
    fetchTeams().then((loaded) => current && setTeams(loaded));
    return () => {
      current = false;
    };
  }, [request]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Spring Draw</h2>
          <p className={styles.meta} aria-live="polite">
            {teams ? 'Draw loaded.' : 'Loading the draw…'}
          </p>
        </div>
        <div className={styles.actions}>
          <fieldset className={styles.switch} aria-label="Loading animation">
            {looks.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={look === option.id}
                onClick={() => {
                  setLook(option.id);
                  setRequest(request + 1);
                }}
              >
                {option.name}
              </button>
            ))}
          </fieldset>
          <button
            type="button"
            className={styles.button}
            disabled={teams === null}
            onClick={() => setRequest(request + 1)}
          >
            Reload
          </button>
        </div>
      </header>
      <div aria-busy={teams === null} data-look={teams ? undefined : look} className={styles.stage}>
        {teams ? (
          <Bracket stage={singleElimination(teams)} connectorRadius={8} className={styles.loaded} />
        ) : (
          <Bracket
            stage={skeleton}
            connectorRadius={8}
            highlightOnHover={false}
            renderMatch={SkeletonMatch}
          />
        )}
      </div>
    </div>
  );
}

/** Later rounds start a little later, so a wave can run across the bracket. */
function SkeletonMatch(match: Match) {
  const [, round = 1, row = 1] = match.id.match(/r(\d+)\.m(\d+)/)?.map(Number) ?? [];
  return (
    <Bracket.Match
      aria-hidden
      style={{ '--delay': `${(round - 1) * 240 + (row - 1) * 90}ms` } as CSSProperties}
    >
      <Bracket.Participant slot={0}>
        <span className={styles.skeleton}>Placeholder</span>
      </Bracket.Participant>
      <Bracket.Participant slot={1}>
        <span className={styles.skeleton}>Team</span>
      </Bracket.Participant>
    </Bracket.Match>
  );
}
