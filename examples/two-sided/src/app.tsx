import { useState } from 'react';
import { Bracket, reportResult, type Stage, singleElimination } from 'react-brackets';
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

const firstRound = Array.from({ length: 8 }, (_, index) => `main.r1.m${index + 1}`);

const stage = firstRound.reduce<Stage>(
  (current, matchId, index) =>
    reportResult(current, matchId, { scores: index % 3 ? [2, 1] : [0, 2] }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

export function App() {
  const [team, setTeam] = useState('Lynx');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>City Championship</h2>
          <p className={styles.meta}>Sixteen teams, two halves, one final in the middle.</p>
        </div>
        <label className={styles.follow}>
          Follow
          <select value={team} onChange={(event) => setTeam(event.target.value)}>
            <option value="">Nobody</option>
            {teams.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </header>
      <Bracket
        stage={stage}
        layout="mirrored"
        mode="fit"
        highlighted={team || null}
        connectorRadius={8}
        className={styles.bracket}
      />
    </div>
  );
}
