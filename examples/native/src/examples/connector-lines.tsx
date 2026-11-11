import {
  Bracket,
  type ConnectorState,
  reportResult,
  type Stage,
  singleElimination,
  type ThemeOverrides,
  useConnector,
} from '@react-brackets/native';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const teams = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];

const stage = (
  [
    ['main.r1.m1', [3, 1]],
    ['main.r1.m2', [0, 2]],
    ['main.r1.m3', [2, 1]],
    ['main.r1.m4', [1, 3]],
    ['main.r2.m1', [2, 0]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(teams.map((name) => ({ id: name, name }))),
);

interface Look {
  theme: ThemeOverrides;
  renderConnector: (line: ConnectorState) => ReactNode;
}

const looks: Record<string, Look> = {
  // Dashed until the match it leaves is decided.
  Dashed: {
    theme: {
      lineWidth: 2,
      connectorRadius: 10,
      colors: { line: '#a78bfa', accent: '#7c3aed', accentSoft: 'rgba(124, 58, 237, 0.12)' },
    },
    renderConnector: ({ status }) => (
      <Bracket.Connector dash={status === 'completed' ? undefined : 'dashed'} />
    ),
  },
  // Dotted lines, and the highlighted path flowing towards the final.
  Flow: {
    theme: {
      lineWidth: 2,
      connectorRadius: 8,
      colors: { line: '#94a3b8', accent: '#ea580c', accentSoft: 'rgba(234, 88, 12, 0.12)' },
    },
    renderConnector: ({ highlighted }) =>
      highlighted ? (
        <Bracket.Connector dash={[6, 4]} flow style={{ width: 3 }} />
      ) : (
        <Bracket.Connector dash="dotted" />
      ),
  },
  // An arrow into every match, green once the winner has gone through.
  Arrows: {
    theme: {
      lineWidth: 1.5,
      connectorRadius: 0,
      radius: 4,
      colors: { line: '#a1a1aa', accent: '#0f766e', accentSoft: 'rgba(15, 118, 110, 0.12)' },
    },
    renderConnector: () => (
      <Bracket.Connector
        arrow
        style={({ status, highlighted }) => ({
          color: highlighted ? '#0f766e' : status === 'completed' ? '#4ade80' : '#a1a1aa',
        })}
      />
    ),
  },
  // Drawn from scratch: a curve in react-native-svg, following the cards as you swipe.
  Curved: {
    theme: {
      lineWidth: 2,
      colors: { line: '#7dd3fc', accent: '#0284c7', accentSoft: 'rgba(2, 132, 199, 0.12)' },
    },
    renderConnector: () => <Curve />,
  },
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

function Curve(): ReactNode {
  const { points, highlighted } = useConnector();
  const animated = useAnimatedProps(() => {
    const { start, end, opacity } = points.value;
    const mid = (start.x + end.x) / 2;
    return {
      d: `M${start.x},${start.y} C${mid},${start.y} ${mid},${end.y} ${end.x},${end.y}`,
      opacity,
    };
  });
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <AnimatedPath
        animatedProps={animated}
        fill="none"
        stroke={highlighted ? '#0284c7' : '#7dd3fc'}
        strokeWidth={highlighted ? 2.5 : 2}
      />
    </Svg>
  );
}

export default function ConnectorLines(): ReactNode {
  const [name, setName] = useState('Dashed');
  const [team, setTeam] = useState<string | null>('Falcons');
  const look = looks[name] ?? looks.Dashed;
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
        {Object.keys(looks).map((option) => (
          <Pressable
            key={option}
            onPress={() => setName(option)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: option === name ? '#ffffff' : 'transparent',
            }}
          >
            <Text style={{ fontWeight: '600', color: option === name ? '#18181b' : '#71717a' }}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* Falcons' path starts highlighted; tap any team to follow theirs. */}
      <Bracket
        stage={stage}
        theme={look?.theme}
        renderConnector={look?.renderConnector}
        highlighted={team}
        onHighlightChange={setTeam}
      />
    </View>
  );
}
