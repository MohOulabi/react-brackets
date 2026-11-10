import {
  allMatches,
  Bracket,
  type Group,
  participantMap,
  qualifiers,
  reportResult,
  roundRobin,
  type Stage,
  singleElimination,
  standings,
} from '@react-brackets/native';
import { type ReactNode, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const draw = roundRobin(
  teams.map((name) => ({ id: name, name })),
  { groups: 2 },
);

const groups = allMatches(draw).reduce<Stage>(
  (current, match, index) =>
    reportResult(current, match.id, { scores: [index % 3, (index + 1) % 3] }),
  draw,
);

// Group winners meet the other group's runner-up in the semifinals.
const playoffs = singleElimination(qualifiers(groups, 2), { id: 'playoffs', thirdPlace: true });

export default function GroupsToPlayoffs(): ReactNode {
  const dark = useColorScheme() === 'dark';
  const [view, setView] = useState<'Groups' | 'Matches' | 'Playoffs'>('Groups');

  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignSelf: 'flex-start',
          padding: 3,
          borderRadius: 999,
          backgroundColor: 'rgba(127, 127, 127, 0.14)',
        }}
      >
        {(['Groups', 'Matches', 'Playoffs'] as const).map((name) => (
          <Pressable
            key={name}
            onPress={() => setView(name)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: name === view ? '#ffffff' : 'transparent',
            }}
          >
            <Text style={{ fontWeight: '600', color: name === view ? '#18181b' : '#71717a' }}>
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
      {view === 'Groups' &&
        groups.groups.map((group) => <Table key={group.id} group={group} dark={dark} />)}
      {/* Every group's match days, as lists; a pool has no lines to draw. */}
      {view === 'Matches' && <Bracket stage={groups} compact="list" />}
      {view === 'Playoffs' && <Bracket stage={playoffs} />}
    </View>
  );
}

/** A group's league table. The top two go through. */
function Table({ group, dark }: { group: Group; dark: boolean }): ReactNode {
  const names = participantMap(groups);
  const text = dark ? '#fafafa' : '#18181b';
  const muted = dark ? '#a1a1aa' : '#71717a';
  const cell = { width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] } as const;
  return (
    <View
      style={{
        padding: 14,
        gap: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: dark ? '#27272a' : '#e4e4e7',
        backgroundColor: dark ? '#111113' : '#ffffff',
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <Text style={{ flex: 1, fontWeight: '700', color: text }}>{group.name}</Text>
        {['W', 'D', 'L', 'Pts'].map((label) => (
          <Text key={label} style={[cell, { fontSize: 12, color: muted }]}>
            {label}
          </Text>
        ))}
      </View>
      {standings(groups, group.id).map((row, index) => (
        <View key={row.participantId} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 6,
              height: 6,
              marginEnd: 8,
              borderRadius: 3,
              backgroundColor: index < 2 ? '#16a34a' : 'transparent',
            }}
          />
          <Text style={{ flex: 1, color: index < 2 ? text : muted }}>
            {names.get(row.participantId)?.name}
          </Text>
          {[row.wins, row.draws, row.losses].map((value, column) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the columns are fixed
            <Text key={column} style={[cell, { color: muted }]}>
              {value}
            </Text>
          ))}
          <Text style={[cell, { fontWeight: '700', color: text }]}>{row.points}</Text>
        </View>
      ))}
    </View>
  );
}
