import {
  Bracket,
  reportResult,
  type Stage,
  singleElimination,
  type ViewportMode,
} from 'react-brackets';

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

const modes: { mode: ViewportMode; title: string; note: string }[] = [
  { mode: 'scroll', title: 'Scroll', note: 'Native horizontal scrolling.' },
  { mode: 'fit', title: 'Fit', note: 'The whole bracket, scaled down to the width available.' },
  { mode: 'pan-zoom', title: 'Pan and zoom', note: 'Drag, pinch, or ctrl/⌘ + scroll to zoom.' },
];

export function App() {
  return (
    <main className="stack">
      <p>
        These brackets never switch to the paged view (<code>compactBelow={'{0}'}</code>). Open this
        page on a phone to compare the three ways of fitting a full tree.
      </p>
      {modes.map(({ mode, title, note }) => (
        <section key={mode}>
          <h2>{title}</h2>
          <p>{note}</p>
          <Bracket stage={stage} mode={mode} compactBelow={0} connectorRadius={8} />
        </section>
      ))}
    </main>
  );
}
