import { useEffect, useState } from 'react';
import { Bracket, type Participant, singleElimination } from 'react-brackets';
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

export function App() {
  const [teams, setTeams] = useState<Participant[] | null>(null);
  const [request, setRequest] = useState(0);

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
        <button
          type="button"
          className={styles.button}
          disabled={teams === null}
          onClick={() => setRequest(request + 1)}
        >
          Reload
        </button>
      </header>
      <div aria-busy={teams === null}>
        {teams ? (
          <Bracket stage={singleElimination(teams)} connectorRadius={8} />
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

function SkeletonMatch() {
  return (
    <Bracket.Match aria-hidden>
      <Bracket.Participant slot={0}>
        <span className={styles.skeleton}>Placeholder</span>
      </Bracket.Participant>
      <Bracket.Participant slot={1}>
        <span className={styles.skeleton}>Team</span>
      </Bracket.Participant>
    </Bracket.Match>
  );
}
