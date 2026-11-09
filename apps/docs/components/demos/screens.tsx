'use client';

import { Bracket, singleElimination, type ViewportMode } from 'react-brackets';
import { play, teams } from './data';
import { Phone } from './preview';

const stage = play(singleElimination(teams(8)), 0.4);
const big = play(singleElimination(teams(16)), 0.3);

export function PagedBracketDemo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Phone label='compact="bracket" (default)'>
        <Bracket stage={stage} connectorRadius={8} />
      </Phone>
      <Phone label='compact="list"'>
        <Bracket stage={stage} compact="list" />
      </Phone>
    </div>
  );
}

export function FullTreeDemo({ mode }: { mode: ViewportMode }) {
  return (
    <Phone label={`mode="${mode}"`}>
      <Bracket stage={big} compactBelow={0} mode={mode} connectorRadius={8} />
    </Phone>
  );
}
