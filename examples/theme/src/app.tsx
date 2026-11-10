import { type CSSProperties, useState } from 'react';
import { Bracket, reportResult, type Stage, singleElimination } from 'react-brackets';
import styles from './app.module.css';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const results: [string, [number, number]][] = [
  ['main.r1.m1', [3, 1]],
  ['main.r1.m2', [0, 2]],
  ['main.r1.m3', [2, 1]],
  ['main.r1.m4', [1, 3]],
  ['main.r2.m1', [2, 0]],
];

const stage = reportResult(
  results.reduce<Stage>(
    (current, [matchId, scores]) => reportResult(current, matchId, { scores }),
    singleElimination(teams.map((name) => ({ id: name, name }))),
  ),
  'main.r2.m2',
  { scores: [1, 1], live: true },
);

const accents = [
  { name: 'Ember', color: '#ea580c' },
  { name: 'Grape', color: '#7c3aed' },
  { name: 'Lagoon', color: '#0d9488' },
  { name: 'Cobalt', color: '#2563eb' },
];

const corners = [
  { name: 'Sharp', radius: '2px' },
  { name: 'Soft', radius: '10px' },
  { name: 'Round', radius: '18px' },
];

export function App() {
  const [accent, setAccent] = useState('#ea580c');
  const [radius, setRadius] = useState('10px');
  const [scheme, setScheme] = useState<'light' | 'dark'>('dark');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Autumn Classic</h2>
          <p className={styles.meta}>The default theme, recoloured with a few CSS variables.</p>
        </div>
        <div className={styles.controls}>
          <fieldset className={styles.swatches} aria-label="Accent">
            {accents.map(({ name, color }) => (
              <button
                key={name}
                type="button"
                aria-label={name}
                aria-pressed={accent === color}
                style={{ background: color }}
                onClick={() => setAccent(color)}
              />
            ))}
          </fieldset>
          <fieldset className={styles.switch} aria-label="Corners">
            {corners.map((corner) => (
              <button
                key={corner.name}
                type="button"
                aria-pressed={radius === corner.radius}
                onClick={() => setRadius(corner.radius)}
              >
                {corner.name}
              </button>
            ))}
          </fieldset>
          <fieldset className={styles.switch} aria-label="Colour scheme">
            {(['light', 'dark'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={scheme === option}
                onClick={() => setScheme(option)}
              >
                {option === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </fieldset>
        </div>
      </header>
      <div className={styles.canvas} data-scheme={scheme}>
        <Bracket
          stage={stage}
          className={styles.brand}
          connectorRadius={8}
          style={{ '--rb-accent': accent, '--rb-radius': radius } as CSSProperties}
        />
      </div>
    </div>
  );
}
