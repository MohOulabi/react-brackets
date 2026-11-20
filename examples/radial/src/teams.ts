import type { Participant } from 'react-brackets';

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

export const teams: Participant[] = names.map((name) => ({ id: name, name }));

/** Steady scores from the match id, so every replay tells the same story. */
export function scoresFor(matchId: string): [number, number] {
  let hash = 0;
  for (const char of matchId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const home = hash % 4;
  const away = (hash >>> 3) % 4;
  return home === away ? [home + 1, away] : [home, away];
}
