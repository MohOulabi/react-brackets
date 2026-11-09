import { Bracket, type ClassNames, reportResult, singleElimination } from 'react-brackets';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = reportResult(
  singleElimination(teams.map((name) => ({ id: name, name }))),
  'main.r1.m1',
  { scores: [3, 1] },
);

const classNames: ClassNames = {
  root: 'text-sm text-zinc-800 dark:text-zinc-100',
  content: 'gap-x-12',
  'round-title': 'pb-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500',
  cell: 'py-1.5',
  match:
    'w-52 overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200 shadow-sm data-highlighted:ring-indigo-500 dark:bg-zinc-900 dark:ring-zinc-700',
  participant:
    'flex items-center justify-between px-3 py-2 not-first:border-t not-first:border-zinc-100 data-winner:font-semibold data-loser:text-zinc-400 data-empty:text-zinc-400 data-highlighted:bg-indigo-50 dark:not-first:border-zinc-800 dark:data-highlighted:bg-indigo-950',
  'participant-score': 'tabular-nums',
  connector: 'stroke-zinc-300 data-highlighted:stroke-indigo-500 dark:stroke-zinc-600',
  pagination: 'mt-3 flex gap-1 overflow-x-auto',
  page: 'rounded-full px-3 py-1 text-xs text-zinc-500 data-active:bg-zinc-900 data-active:text-white',
  'page-previous': 'px-2 text-zinc-500 disabled:opacity-30 rtl:-scale-x-100',
  'page-next': 'px-2 text-zinc-500 disabled:opacity-30 rtl:-scale-x-100',
};

export function App() {
  return (
    <main className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <Bracket stage={stage} classNames={classNames} connectorRadius={6} />
    </main>
  );
}
