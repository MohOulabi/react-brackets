import {
  allMatches,
  type Id,
  participantMap,
  reportResult,
  type Stage,
  singleElimination,
} from '@react-brackets/native';
import { useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { hue, isOut, linkPath, rings, type Spot } from './rings';
import { scoresFor, teams } from './teams';

const SIZE = 640;
const TROPHY = '🏆';

/** The bracket with every match up to the semifinals played, so a few results crown a champion. */
function start(): Stage {
  let stage = singleElimination(teams);
  for (let played = 0; played < 28; played++) {
    const next = allMatches(stage).find((match) => match.status === 'ready');
    if (!next) break;
    stage = reportResult(stage, next.id, { scores: scoresFor(next.id) });
  }
  return stage;
}

/**
 * A 32-team bracket drawn as rings around its champion. The library's core knows
 * the tournament; this screen only draws it, with react-native-svg.
 */
export default function Radial() {
  const dark = useColorScheme() === 'dark';
  const [stage, setStage] = useState(start);
  const [focus, setFocus] = useState<Id | null>(null);
  const names = participantMap(stage);
  const layout = rings(stage, SIZE);
  const { spots, links, middle } = layout;
  const champion = spots[middle]?.[0]?.participantId;
  const next = allMatches(stage).find((match) => match.status === 'ready');
  const lit = (spot: Spot) => focus !== null && spot.participantId === focus;
  const line = dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)';

  return (
    <View style={{ gap: 12, alignItems: 'center' }}>
      <Text style={{ color: dark ? '#a1a1aa' : '#71717a' }}>
        {champion ? `${names.get(champion)?.name} win the cup.` : 'Tap a team to follow its path.'}
      </Text>

      <Svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', aspectRatio: 1 }}>
        <Defs>
          <RadialGradient id="glow">
            <Stop offset="0" stopColor="#f5b84a" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#f5b84a" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE * 0.28} fill="url(#glow)" />

        {links.map((link) => {
          const on = lit(link.from) && lit(link.to);
          return (
            <Path
              key={`${link.from.ring}.${link.from.index}`}
              d={linkPath(link, SIZE)}
              fill="none"
              stroke={on ? '#e7a425' : line}
              strokeWidth={on ? 3 : 1.2}
            />
          );
        })}

        {spots.flat().map((spot) => {
          const key = `${spot.ring}.${spot.index}`;
          const size = spot.ring === middle ? 36 : 12 + spot.ring * 2.5;
          const team = spot.participantId ? names.get(spot.participantId) : undefined;
          if (!team) {
            return (
              <Circle
                key={key}
                cx={spot.x}
                cy={spot.y}
                r={size * 0.75}
                fill={line}
                fillOpacity={0.2}
                stroke={line}
                strokeDasharray="3 3"
              />
            );
          }
          return (
            <G
              key={key}
              opacity={isOut(spot, layout) && !lit(spot) ? 0.35 : 1}
              onPress={() => setFocus(focus === team.id ? null : team.id)}
            >
              <Circle
                cx={spot.x}
                cy={spot.y}
                r={size}
                fill={`hsl(${hue(team.id)} 48% 52%)`}
                stroke={lit(spot) || spot.ring === middle ? 'white' : 'none'}
                strokeWidth={2}
              />
              <SvgText
                x={spot.x}
                y={spot.y + size * 0.28}
                fontSize={size * 0.8}
                fontWeight="600"
                fill="white"
                textAnchor="middle"
              >
                {team.name.slice(0, 2)}
              </SvgText>
            </G>
          );
        })}

        {champion && (
          <SvgText x={SIZE / 2} y={SIZE / 2 - 50} fontSize={24} textAnchor="middle">
            {TROPHY}
          </SvgText>
        )}
      </Svg>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          label="Next result"
          dark={dark}
          disabled={!next}
          onPress={() =>
            next && setStage(reportResult(stage, next.id, { scores: scoresFor(next.id) }))
          }
        />
        <Button
          label="Start over"
          dark={dark}
          onPress={() => {
            setStage(start());
            setFocus(null);
          }}
        />
      </View>
    </View>
  );
}

function Button({
  label,
  dark,
  disabled,
  onPress,
}: {
  label: string;
  dark: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 18,
        height: 38,
        justifyContent: 'center',
        borderRadius: 19,
        borderWidth: 1,
        borderColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)',
        backgroundColor: pressed
          ? dark
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(0,0,0,0.06)'
          : 'transparent',
        opacity: disabled ? 0.45 : 1,
      })}
    >
      <Text style={{ fontWeight: '600', color: dark ? '#fafafa' : '#18181b' }}>{label}</Text>
    </Pressable>
  );
}
