import { Bracket, reportResult, type Stage, singleElimination } from '@react-brackets/native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = (
  [
    ['main.r1.m1', [3, 1]],
    ['main.r1.m2', [0, 2]],
    ['main.r1.m3', [2, 1]],
    ['main.r1.m4', [1, 3]],
    ['main.r2.m1', [2, 0]],
    ['main.r2.m2', [1, 2]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

export default function FollowATeam() {
  const [team, setTeam] = useState<string | null>('Falcons');

  return (
    <View style={{ gap: 16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {teams.map((name) => {
            const selected = name === team;
            return (
              <Pressable
                key={name}
                onPress={() => setTeam(selected ? null : name)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: selected ? '#2563eb' : '#e4e4e7',
                }}
              >
                <Text style={{ fontWeight: '600', color: selected ? '#ffffff' : '#27272a' }}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {/* Controlled: the chips decide whose path lights up, and tapping a team in the bracket does too. */}
      <Bracket stage={stage} highlighted={team} onHighlightChange={setTeam} />
    </View>
  );
}
