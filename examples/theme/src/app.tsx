import { useState } from 'react';
import { Bracket, reportResult, type Stage, singleElimination } from 'react-brackets';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const results: [string, [number, number]][] = [
  ['main.r1.m1', [3, 1]],
  ['main.r1.m2', [0, 2]],
  ['main.r1.m3', [2, 1]],
  ['main.r1.m4', [1, 3]],
  ['main.r2.m1', [2, 0]],
];

const stage = results.reduce<Stage>(
  (current, [matchId, scores]) => reportResult(current, matchId, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

const live = reportResult(stage, 'main.r2.m2', { scores: [1, 1], live: true });

export function App() {
  const [scheme, setScheme] = useState<'light' | 'dark'>('dark');

  return (
    <main className="page" style={{ colorScheme: scheme }}>
      <header>
        <h1>Theme</h1>
        <button type="button" onClick={() => setScheme(scheme === 'dark' ? 'light' : 'dark')}>
          Switch to {scheme === 'dark' ? 'light' : 'dark'}
        </button>
      </header>
      <Bracket stage={live} className="brand" connectorRadius={8} />
    </main>
  );
}
