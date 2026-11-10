import { useState } from 'react';
import {
  Bracket,
  type Match,
  participantMap,
  reportResult,
  type Stage,
  singleElimination,
} from 'react-brackets';
import styles from './app.module.css';

const teams = [
  { id: 'fal', name: 'Falcons', color: '#f97316', city: 'Harbourside' },
  { id: 'wol', name: 'Wolves', color: '#6366f1', city: 'Northgate' },
  { id: 'her', name: 'Herons', color: '#14b8a6', city: 'Riverbend' },
  { id: 'lyn', name: 'Lynx', color: '#eab308', city: 'Old Town' },
];

let stage: Stage = singleElimination(
  teams.map(({ id, name, color, city }) => ({ id, name, meta: { color, city } })),
);
stage = reportResult(stage, 'main.r1.m1', { scores: [78, 71] });
stage = reportResult(stage, 'main.r1.m2', { scores: [64, 64], live: true });

const names = participantMap(stage);

const fixtures: Record<string, { kickoff: string; venue: string }> = {
  'main.r1.m1': { kickoff: 'Fri 19:00', venue: 'Pier Arena' },
  'main.r1.m2': { kickoff: 'Fri 21:30', venue: 'Northgate Hall' },
  'main.r2.m1': { kickoff: 'Sun 20:00', venue: 'Pier Arena' },
};

const statusLabel: Record<Match['status'], string> = {
  waiting: 'Waiting for teams',
  ready: 'Up next',
  live: 'Live',
  completed: 'Full time',
  skipped: 'Bye',
};

function MatchCard({ match, selected }: { match: Match; selected: boolean }) {
  return (
    <Bracket.Match className={styles.card} data-selected={selected || undefined}>
      <header>
        <span>{fixtures[match.id]?.kickoff}</span>
        {match.status === 'live' && <span className={styles.live}>Live</span>}
      </header>
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant key={slot} slot={slot} className={styles.team}>
          {({ participant, slot: { score } }) => (
            <>
              <Badge color={participant?.meta?.color} name={participant?.name} />
              <span className={styles.name}>{participant?.name ?? 'To be decided'}</span>
              <span className={styles.score}>{score ?? '–'}</span>
            </>
          )}
        </Bracket.Participant>
      ))}
    </Bracket.Match>
  );
}

function Badge({ color, name }: { color: unknown; name?: string }) {
  return (
    <span className={styles.badge} style={{ background: String(color ?? '#a1a1aa') }}>
      {name?.slice(0, 1) ?? '?'}
    </span>
  );
}

export function App() {
  const [selected, setSelected] = useState<Match | undefined>(
    stage.groups[0]?.rounds[0]?.matches[1],
  );
  const fixture = selected && fixtures[selected.id];

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h2 className={styles.title}>Harbour League Finals</h2>
        <p className={styles.meta}>Pick a match to see its details.</p>
      </header>
      <div className={styles.body}>
        <Bracket
          stage={stage}
          connectorRadius={10}
          renderMatch={(match) => <MatchCard match={match} selected={match.id === selected?.id} />}
          onMatchClick={setSelected}
        />
        {selected && (
          <aside className={styles.detail} aria-live="polite">
            <p className={styles.status} data-status={selected.status}>
              {statusLabel[selected.status]}
            </p>
            {selected.slots.map((slot, index) => {
              const team = slot.participantId ? names.get(slot.participantId) : undefined;
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: a match always has the same two slots
                <div key={index} className={styles.side}>
                  <Badge color={team?.meta?.color} name={team?.name} />
                  <div>
                    <strong>{team?.name ?? 'To be decided'}</strong>
                    <span>{String(team?.meta?.city ?? '')}</span>
                  </div>
                  <span className={styles.big}>{slot.score ?? '–'}</span>
                </div>
              );
            })}
            {fixture && (
              <dl>
                <dt>Kickoff</dt>
                <dd>{fixture.kickoff}</dd>
                <dt>Venue</dt>
                <dd>{fixture.venue}</dd>
              </dl>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
