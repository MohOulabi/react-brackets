'use client';

import { RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bracket, type Participant, singleElimination } from 'react-brackets';
import { Button } from '@/components/ui/button';
import { play, teams } from './data';

const placeholders: Participant[] = Array.from({ length: 8 }, (_, index) => ({
  id: `placeholder-${index}`,
  name: '',
}));
const skeleton = singleElimination(placeholders);
const loaded = play(singleElimination(teams(8)), 0.45);

export function SkeletonDemo() {
  const [request, setRequest] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setRequest(request + 1)}
      >
        <RotateCw className="size-3.5" />
        Load again
      </Button>
      <SlowBracket key={request} />
    </div>
  );
}

/** Loads for a moment on every mount, like a request would. */
function SlowBracket() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div aria-busy={!ready}>
      {ready ? (
        <Bracket stage={loaded} compactBelow={0} connectorRadius={8} />
      ) : (
        <Bracket
          stage={skeleton}
          compactBelow={0}
          connectorRadius={8}
          highlightOnHover={false}
          renderMatch={SkeletonMatch}
        />
      )}
    </div>
  );
}

function SkeletonMatch() {
  return (
    <Bracket.Match aria-hidden>
      <Bracket.Participant slot={0}>
        <span className="rounded-full bg-muted text-transparent motion-safe:animate-pulse">
          Placeholder
        </span>
      </Bracket.Participant>
      <Bracket.Participant slot={1}>
        <span className="rounded-full bg-muted text-transparent motion-safe:animate-pulse">
          Team
        </span>
      </Bracket.Participant>
    </Bracket.Match>
  );
}
