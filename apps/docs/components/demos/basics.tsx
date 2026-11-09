'use client';

import { RotateCcw, StepForward } from 'lucide-react';
import { useState } from 'react';
import {
  allMatches,
  Bracket,
  reportResult,
  resetResult,
  type Stage,
  singleElimination,
} from 'react-brackets';
import { Button } from '@/components/ui/button';
import { scoresFor, teams } from './data';

export function QuickStartDemo() {
  return <Bracket stage={singleElimination(teams(8))} />;
}

export function ResultsDemo() {
  const [stage, setStage] = useState<Stage>(() =>
    singleElimination(teams(8), { thirdPlace: true }),
  );
  const next = allMatches(stage).find((match) => match.status === 'ready');
  const last = allMatches(stage)
    .filter((match) => match.status === 'completed' && !match.slots.some((slot) => slot.bye))
    .at(-1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!next}
          onClick={() =>
            next && setStage(reportResult(stage, next.id, { scores: scoresFor(next.id) }))
          }
        >
          <StepForward /> Play next match
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!last}
          onClick={() => last && setStage(resetResult(stage, last.id))}
        >
          <RotateCcw /> Undo last result
        </Button>
      </div>
      <Bracket stage={stage} connectorRadius={8} />
    </div>
  );
}
