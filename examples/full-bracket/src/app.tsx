import { useState } from 'react';
import {
  Bracket,
  reportResult,
  type Stage,
  singleElimination,
  type ViewportMode,
} from 'react-brackets';
import styles from './app.module.css';

const teams = [
  'Falcons',
  'Wolves',
  'Herons',
  'Lynx',
  'Orcas',
  'Ravens',
  'Bison',
  'Cobras',
  'Hawks',
  'Otters',
  'Cranes',
  'Pumas',
  'Sharks',
  'Owls',
  'Moose',
  'Vipers',
];

const stage = Array.from({ length: 8 }, (_, index) => `main.r1.m${index + 1}`).reduce<Stage>(
  (current, matchId, index) =>
    reportResult(current, matchId, { scores: index % 3 ? [2, 1] : [0, 2] }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

const modes: { mode: ViewportMode; name: string; note: string }[] = [
  { mode: 'scroll', name: 'Scroll', note: 'Scrolls sideways, like any wide table.' },
  { mode: 'fit', name: 'Fit', note: 'Scaled down so the whole tree fits the width.' },
  {
    mode: 'pan-zoom',
    name: 'Pan and zoom',
    note: 'Drag to move, pinch or ctrl/⌘ + scroll to zoom.',
  },
];

export function App() {
  const [mode, setMode] = useState<ViewportMode>('fit');
  const note = modes.find((option) => option.mode === mode)?.note;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>National Finals</h2>
          <p className={styles.meta}>{note}</p>
        </div>
        <fieldset className={styles.switch} aria-label="Fit">
          {modes.map((option) => (
            <button
              key={option.mode}
              type="button"
              aria-pressed={option.mode === mode}
              onClick={() => setMode(option.mode)}
            >
              {option.name}
            </button>
          ))}
        </fieldset>
      </header>
      {/* compactBelow={0} keeps the whole tree, even on a phone. */}
      <Bracket key={mode} stage={stage} mode={mode} compactBelow={0} connectorRadius={8} />
    </div>
  );
}
