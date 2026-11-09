import { useState } from 'react';
import { Bracket, type Match, reportResult, type Stage, singleElimination } from 'react-brackets';

const teams = [
  { id: 'fal', name: 'Falcons', color: '#f97316' },
  { id: 'wol', name: 'Wolves', color: '#6366f1' },
  { id: 'her', name: 'Herons', color: '#14b8a6' },
  { id: 'lyn', name: 'Lynx', color: '#eab308' },
];

let stage: Stage = singleElimination(
  teams.map(({ id, name, color }) => ({ id, name, meta: { color } })),
);
stage = reportResult(stage, 'main.r1.m1', { scores: [78, 71] });
stage = reportResult(stage, 'main.r1.m2', { scores: [64, 64], live: true });

const kickoff: Record<string, string> = {
  'main.r1.m1': 'Fri 19:00',
  'main.r1.m2': 'Fri 21:30',
  'main.r2.m1': 'Sun 20:00',
};

function MatchCard({ match }: { match: Match }) {
  return (
    <Bracket.Match className="card">
      <header>
        <span>{kickoff[match.id]}</span>
        {match.status === 'live' && <span className="live">Live</span>}
      </header>
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant key={slot} slot={slot} className="team">
          {({ participant, slot: { score } }) => (
            <>
              <span
                className="badge"
                style={{ background: String(participant?.meta?.color ?? '#a1a1aa') }}
              >
                {participant?.name.slice(0, 1) ?? '?'}
              </span>
              <span className="name">{participant?.name ?? 'To be decided'}</span>
              <span className="score">{score ?? '–'}</span>
            </>
          )}
        </Bracket.Participant>
      ))}
    </Bracket.Match>
  );
}

export function App() {
  const [selected, setSelected] = useState<Match | null>(null);

  return (
    <>
      <Bracket
        stage={stage}
        connectorRadius={10}
        renderMatch={(match) => <MatchCard match={match} />}
        onMatchClick={setSelected}
      />
      <p className="selection">
        {selected ? `Selected ${selected.id} (${selected.status})` : 'Click a match'}
      </p>
    </>
  );
}
