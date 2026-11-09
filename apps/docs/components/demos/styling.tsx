'use client';

import { Bracket, type ClassNames, type Match, singleElimination } from 'react-brackets';
import { play, teams } from './data';

const stage = play(singleElimination(teams(8)), 0.4);

export function ThemeDemo() {
  return (
    <Bracket
      stage={stage}
      connectorRadius={14}
      style={{
        ['--rb-accent' as string]: '#ea580c',
        ['--rb-radius' as string]: '14px',
        ['--rb-match-width' as string]: '11rem',
        ['--rb-line-width' as string]: '2px',
      }}
    />
  );
}

const tailwind: ClassNames = {
  content: 'gap-x-14',
  'round-title':
    'pb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground',
  cell: 'py-2',
  match:
    'w-52 overflow-hidden rounded-2xl bg-gradient-to-b from-card to-muted/40 shadow-sm ring-1 ring-border transition data-highlighted:ring-2 data-highlighted:ring-brand',
  participant:
    'flex items-center justify-between px-4 py-2.5 text-sm not-first:border-t data-loser:text-muted-foreground data-winner:font-semibold data-highlighted:bg-brand/10',
  'participant-score': 'tabular-nums in-data-winner:text-brand',
  connector: 'stroke-border [stroke-width:2] data-highlighted:stroke-brand',
};

export function TailwindDemo() {
  return <Bracket stage={stage} classNames={tailwind} connectorRadius={12} unstyled />;
}

function Card({ match }: { match: Match }) {
  return (
    <Bracket.Match className="w-60 overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-muted-foreground">
        <span>{match.id.replace('main.', '').toUpperCase()}</span>
        {match.status === 'live' && <span className="font-semibold text-red-500">● Live</span>}
        {match.status === 'completed' && <span>Final</span>}
      </header>
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant
          key={slot}
          slot={slot}
          className="flex items-center gap-2 px-3 py-2 text-sm"
        >
          {({ participant, winner, slot: { score } }) => (
            <>
              <span className="grid size-6 place-items-center rounded-md bg-muted text-xs font-bold">
                {participant?.name[0] ?? '?'}
              </span>
              <span className={winner ? 'flex-1 font-semibold' : 'flex-1'}>
                {participant?.name ?? 'To be decided'}
              </span>
              <span className="tabular-nums">{score ?? '–'}</span>
            </>
          )}
        </Bracket.Participant>
      ))}
    </Bracket.Match>
  );
}

export function CustomMatchDemo() {
  return (
    <Bracket stage={stage} connectorRadius={10} renderMatch={(match) => <Card match={match} />} />
  );
}

export function RtlDemo() {
  const clubs = ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'الشباب', 'التعاون', 'الفتح', 'الرائد'];
  const names = ['ربع النهائي', 'نصف النهائي', 'النهائي'];
  const arabic = play(
    singleElimination(
      clubs.map((name, index) => ({ id: String(index), name })),
      { roundName: (index) => names[index] ?? '' },
    ),
    0.3,
  );
  return (
    <div dir="rtl" lang="ar">
      <Bracket
        stage={arabic}
        connectorRadius={8}
        labels={{
          tbd: 'لم يحدد',
          previous: 'الجولة السابقة',
          next: 'الجولة التالية',
          rounds: 'الجولات',
        }}
      />
    </div>
  );
}
