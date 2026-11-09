import { expect, test } from 'bun:test';
import { fromRounds, getMatch, type RoundInput, reportResult } from '../src';

const semifinals: RoundInput = {
  name: 'Semifinals',
  matches: [
    { participants: [{ name: 'Falcons' }, { name: 'Eagles' }] },
    { participants: [{ name: 'Wolves' }, { name: 'Bears' }] },
  ],
};
const rounds: RoundInput[] = [
  semifinals,
  { name: 'Final', matches: [{ participants: [null, null] }] },
];

test('collects participants and links rounds that halve', () => {
  const stage = fromRounds(rounds);

  expect(stage.participants.map((participant) => participant.name)).toEqual([
    'Falcons',
    'Eagles',
    'Wolves',
    'Bears',
  ]);
  expect(getMatch(stage, 'main.r2.m1').slots[1].origin?.matchId).toBe('main.r1.m2');
});

test('keeps participants you provide even without results', () => {
  const stage = fromRounds([
    semifinals,
    { name: 'Final', matches: [{ participants: [{ name: 'Falcons' }, { name: 'Bears' }] }] },
  ]);

  expect(getMatch(stage, 'main.r2.m1')).toMatchObject({ status: 'ready' });
});

test('propagates results like any generated stage', () => {
  const stage = reportResult(fromRounds(rounds), 'main.r1.m2', { scores: [0, 1] });
  expect(getMatch(stage, 'main.r2.m1').slots[1].participantId).toBe('Bears');
});
