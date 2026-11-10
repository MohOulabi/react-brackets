import {
  Crosshair,
  Crown,
  Flame,
  Ghost,
  type LucideIcon,
  Mountain,
  Rocket,
  Shield,
  Skull,
  Snowflake,
  Swords,
  Trees,
  Waves,
  Zap,
} from 'lucide-react';

export type Role = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

export const roles: Record<Role, { name: string; icon: LucideIcon }> = {
  top: { name: 'Top', icon: Swords },
  jungle: { name: 'Jungle', icon: Trees },
  mid: { name: 'Mid', icon: Zap },
  bot: { name: 'Bot', icon: Crosshair },
  support: { name: 'Support', icon: Shield },
};

export interface Team {
  id: string;
  name: string;
  region: string;
  seed: number;
  color: string;
  icon: LucideIcon;
  roster: { player: string; role: Role; kda: number }[];
}

const lineup = (players: string[], kdas: number[]): Team['roster'] =>
  (['top', 'jungle', 'mid', 'bot', 'support'] as const).map((role, index) => ({
    role,
    player: players[index] ?? '',
    kda: kdas[index] ?? 0,
  }));

/** Listed by seed, so the favourites meet as late as possible. */
export const teams: Team[] = [
  {
    id: 'ember',
    name: 'Ember Kings',
    region: 'KR',
    seed: 1,
    color: '#f97316',
    icon: Flame,
    roster: lineup(['Haneul', 'Jisoo', 'Raon', 'Dowon', 'Sena'], [3.8, 4.6, 6.1, 5.4, 4.9]),
  },
  {
    id: 'frost',
    name: 'Frostline',
    region: 'EU',
    seed: 2,
    color: '#38bdf8',
    icon: Snowflake,
    roster: lineup(['Vesper', 'Kodiak', 'Lumen', 'Arrow', 'Halcyon'], [3.2, 4.1, 5.7, 6.3, 4.4]),
  },
  {
    id: 'crown',
    name: 'Crown Theory',
    region: 'CN',
    seed: 3,
    color: '#eab308',
    icon: Crown,
    roster: lineup(['Yuheng', 'Shan', 'Lingxi', 'Bai', 'Qiu'], [3.5, 3.9, 5.2, 5.9, 4.1]),
  },
  {
    id: 'phantom',
    name: 'Phantom Unit',
    region: 'NA',
    seed: 4,
    color: '#a78bfa',
    icon: Ghost,
    roster: lineup(['Rook', 'Wisp', 'Cipher', 'Nova', 'Atlas'], [2.9, 3.6, 4.8, 5.1, 3.9]),
  },
  {
    id: 'summit',
    name: 'Summit',
    region: 'EU',
    seed: 5,
    color: '#34d399',
    icon: Mountain,
    roster: lineup(['Brann', 'Fjord', 'Kaito', 'Rune', 'Ilse'], [3.1, 3.3, 4.6, 4.9, 4.2]),
  },
  {
    id: 'tide',
    name: 'Riptide',
    region: 'BR',
    seed: 6,
    color: '#22d3ee',
    icon: Waves,
    roster: lineup(['Tubarão', 'Mata', 'Raio', 'Flecha', 'Escudo'], [2.7, 3.4, 4.4, 4.7, 3.6]),
  },
  {
    id: 'orbit',
    name: 'Orbit',
    region: 'NA',
    seed: 7,
    color: '#f472b6',
    icon: Rocket,
    roster: lineup(['Comet', 'Drift', 'Quasar', 'Ion', 'Halo'], [2.6, 3.1, 4.2, 4.5, 3.3]),
  },
  {
    id: 'grave',
    name: 'Gravewalkers',
    region: 'VN',
    seed: 8,
    color: '#94a3b8',
    icon: Skull,
    roster: lineup(['Tuan', 'Bao', 'Khoa', 'Minh', 'Linh'], [2.4, 2.9, 3.8, 4.1, 3.2]),
  },
];

export const teamById = new Map(teams.map((team) => [team.id, team]));
