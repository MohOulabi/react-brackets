import { Bracket, reportResult, type Stage, singleElimination } from '@react-brackets/native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

// Library components take a className once wrapped; React Native's own take one as they are.
const Match = withUniwind(Bracket.Match);

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const cup = (
  [
    ['main.r1.m1', [3, 1]],
    ['main.r1.m2', [0, 2]],
    ['main.r1.m3', [2, 1]],
    ['main.r1.m4', [1, 3]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

export default function Tailwind(): ReactNode {
  return (
    <View className="gap-4 rounded-3xl bg-indigo-50 p-4 dark:bg-indigo-950">
      <Text className="text-lg font-bold text-indigo-950 dark:text-indigo-50">
        Tailwind, through Uniwind
      </Text>
      <Bracket
        stage={cup}
        theme={{ colors: { line: '#a5b4fc', accent: '#4f46e5' } }}
        renderMatch={() => (
          <Match className="rounded-2xl border-indigo-200 bg-white dark:border-indigo-800 dark:bg-indigo-900">
            {([0, 1] as const).map((slot) => (
              <Bracket.Participant
                key={slot}
                slot={slot}
                style={{ paddingHorizontal: 0, paddingVertical: 0 }}
              >
                {({ participant, slot: { score }, winner }) => (
                  <View className="flex-1 flex-row items-center px-3 py-2.5">
                    <Text
                      numberOfLines={1}
                      className={
                        winner
                          ? 'flex-1 font-bold text-indigo-950 dark:text-white'
                          : 'flex-1 text-indigo-900/60 dark:text-indigo-200/60'
                      }
                    >
                      {participant?.name ?? 'To be decided'}
                    </Text>
                    <Text className="font-semibold text-indigo-600 dark:text-indigo-300">
                      {score}
                    </Text>
                  </View>
                )}
              </Bracket.Participant>
            ))}
          </Match>
        )}
      />
    </View>
  );
}
