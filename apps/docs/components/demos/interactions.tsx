'use client';

import { MousePointerClick } from 'lucide-react';
import { useState } from 'react';
import {
  Bracket,
  getMatch,
  type Id,
  participantMap,
  reportResult,
  type Stage,
  singleElimination,
} from 'react-brackets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { teams } from './data';

export function ClickDemo() {
  const [stage, setStage] = useState<Stage>(() => singleElimination(teams(8)));
  const [selectedId, setSelectedId] = useState<Id | null>('main.r1.m1');
  const names = participantMap(stage);
  const selected = selectedId ? getMatch(stage, selectedId) : null;
  const playable = selected?.status === 'ready' || selected?.status === 'live';

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <Bracket
        stage={stage}
        connectorRadius={8}
        onMatchClick={(match) => setSelectedId(match.id)}
        renderMatch={(match) => (
          <Bracket.Match
            className={
              match.id === selectedId
                ? 'ring-2 ring-brand ring-offset-2 ring-offset-background'
                : undefined
            }
          >
            <Bracket.Participant slot={0} />
            <Bracket.Participant slot={1} />
          </Bracket.Match>
        )}
      />
      <aside className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-sm">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium">{selected.id}</span>
              <Badge variant="secondary">{selected.status}</Badge>
            </div>
            <p className="text-muted-foreground">Pick the winner:</p>
            {([0, 1] as const).map((slot) => {
              const participantId = selected.slots[slot].participantId;
              return (
                <Button
                  key={slot}
                  variant="outline"
                  className="justify-start"
                  disabled={!playable}
                  onClick={() =>
                    setStage(
                      reportResult(stage, selected.id, { scores: slot === 0 ? [1, 0] : [0, 1] }),
                    )
                  }
                >
                  {(participantId && names.get(participantId)?.name) ?? 'To be decided'}
                </Button>
              );
            })}
          </>
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="size-4" /> Click a match
          </p>
        )}
      </aside>
    </div>
  );
}

export function FollowTeamDemo() {
  const stage = singleElimination(teams(8));
  const [followed, setFollowed] = useState<Id | null>(null);

  return (
    <Bracket
      stage={stage}
      connectorRadius={8}
      highlighted={followed}
      renderMatch={() => (
        <Bracket.Match>
          {([0, 1] as const).map((slot) => (
            <Bracket.Participant
              key={slot}
              slot={slot}
              className="cursor-pointer"
              onClick={(event) => {
                const id = event.currentTarget.dataset.participant;
                if (id) setFollowed(followed === id ? null : id);
              }}
            />
          ))}
        </Bracket.Match>
      )}
    />
  );
}

export function ControlledPageDemo() {
  const stage = singleElimination(teams(8));
  const [page, setPage] = useState(0);
  const rounds = stage.groups[0]?.rounds ?? [];

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <Tabs value={String(page)} onValueChange={(value) => setPage(Number(value))}>
        <TabsList className="w-full">
          {rounds.map((round, index) => (
            <TabsTrigger key={round.id} value={String(index)}>
              {round.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Bracket
        stage={stage}
        compactBelow={10_000}
        page={page}
        onPageChange={setPage}
        classNames={{ pagination: 'hidden' }}
      />
    </div>
  );
}
