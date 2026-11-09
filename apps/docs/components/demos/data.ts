import {
  allMatches,
  nextSwissRound,
  type Participant,
  reportResult,
  type Stage,
  swissRoundsLeft,
} from 'react-brackets';

const names = [
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
  'Eagles',
  'Foxes',
  'Badgers',
  'Rhinos',
  'Jaguars',
  'Ospreys',
  'Stags',
  'Mantas',
  'Bears',
  'Geckos',
  'Hornets',
  'Ibex',
  'Kites',
  'Lions',
  'Marlins',
  'Newts',
];

export const teams = (count: number): Participant[] =>
  names.slice(0, count).map((name) => ({ id: name, name }));

/** Deterministic scores, so the same settings always tell the same story. */
export function scoresFor(matchId: string): [number, number] {
  let hash = 0;
  for (const char of matchId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const home = hash % 4;
  const away = (hash >>> 3) % 4;
  return home === away ? [home + 1, away] : [home, away];
}

/** Plays matches in order until `fraction` of them are finished. */
export function play(stage: Stage, fraction: number): Stage {
  let current = stage;
  for (;;) {
    const matches = allMatches(current);
    const done = matches.filter(
      (match) => match.status === 'completed' || match.status === 'skipped',
    );
    if (fraction < 1 && done.length >= matches.length * fraction) return current;

    const ready = matches.find((match) => match.status === 'ready');
    if (ready) current = reportResult(current, ready.id, { scores: scoresFor(ready.id) });
    else if (current.format === 'swiss' && swissRoundsLeft(current) > 0)
      current = nextSwissRound(current);
    else return current;
  }
}
