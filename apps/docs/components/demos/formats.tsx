'use client';

import { Shuffle } from 'lucide-react';
import { useState } from 'react';
import {
  allMatches,
  Bracket,
  doubleElimination,
  nextSwissRound,
  participantMap,
  qualifiers,
  reportResult,
  roundRobin,
  type Stage,
  singleElimination,
  standings,
  swiss,
  swissRoundsLeft,
} from 'react-brackets';
import { Button } from '@/components/ui/button';
import { play, scoresFor, teams } from './data';

export function DoubleEliminationDemo() {
  return <Bracket stage={play(doubleElimination(teams(8)), 0.45)} connectorRadius={8} />;
}

export function MirroredDemo() {
  return (
    <Bracket
      stage={play(singleElimination(teams(16)), 0.3)}
      layout="mirrored"
      connectorRadius={8}
      style={{ ['--rb-match-width' as string]: '9rem', ['--rb-column-gap' as string]: '1.75rem' }}
    />
  );
}

export function StandingsTable({ stage, groupId }: { stage: Stage; groupId?: string }) {
  const names = participantMap(stage);
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm tabular-nums">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-end [&>th]:font-medium">
            <th className="!text-start">Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>+/-</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings(stage, groupId).map((row, index) => (
            <tr
              key={row.participantId}
              className="border-t [&>td]:px-3 [&>td]:py-2 [&>td]:text-end"
            >
              <td className="!text-start">
                <span className="me-2 text-muted-foreground">{index + 1}</span>
                {names.get(row.participantId)?.name}
              </td>
              <td>{row.played}</td>
              <td>{row.wins}</td>
              <td>{row.draws}</td>
              <td>{row.losses}</td>
              <td>{row.scored - row.conceded}</td>
              <td className="font-semibold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RoundRobinDemo() {
  const stage = play(roundRobin(teams(6)), 0.6);
  return (
    <div className="flex flex-col gap-6">
      <StandingsTable stage={stage} />
      <Bracket stage={stage} />
    </div>
  );
}

const simulateRound = (stage: Stage) =>
  allMatches(stage)
    .filter((match) => match.status === 'ready')
    .reduce(
      (current, match) => reportResult(current, match.id, { scores: scoresFor(match.id) }),
      stage,
    );

export function SwissDemo() {
  const [stage, setStage] = useState(() => swiss(teams(9)));
  const roundOpen = allMatches(stage).some((match) => match.status === 'ready');
  const finished = !roundOpen && swissRoundsLeft(stage) === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={finished}
          onClick={() => setStage(roundOpen ? simulateRound(stage) : nextSwissRound(stage))}
        >
          <Shuffle />{' '}
          {finished ? 'Finished' : roundOpen ? 'Play this round' : 'Pair the next round'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setStage(swiss(teams(9)))}>
          Start over
        </Button>
      </div>
      <StandingsTable stage={stage} />
      <Bracket stage={stage} />
    </div>
  );
}

export function GroupsToPlayoffsDemo() {
  const groups = play(roundRobin(teams(8), { groups: 2 }), 1);
  const playoffs = singleElimination(qualifiers(groups, 2), { id: 'playoffs', thirdPlace: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        {groups.groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <h4 className="font-medium">{group.name}</h4>
            <StandingsTable stage={groups} groupId={group.id} />
          </div>
        ))}
      </div>
      <Bracket stage={playoffs} connectorRadius={8} />
    </div>
  );
}
