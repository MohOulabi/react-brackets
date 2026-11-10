import {
  allMatches,
  Bracket,
  getMatch,
  type Match,
  reportResult,
  type Stage,
  singleElimination,
} from '@react-brackets/native';
import { type ReactNode, useEffect, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';

const roles = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];

/** Five players in role order, each with their KDA. */
const lineup = (players: string[], kdas: number[]) =>
  players.map((player, index) => ({ player, role: roles[index], kda: kdas[index] ?? 0 }));

/** Listed by seed, so the favourites meet as late as possible. */
const teams = [
  {
    id: 'ember',
    name: 'Ember Kings',
    region: 'KR',
    color: '#f97316',
    roster: lineup(['Haneul', 'Jisoo', 'Raon', 'Dowon', 'Sena'], [3.8, 4.6, 6.1, 5.4, 4.9]),
  },
  {
    id: 'frost',
    name: 'Frostline',
    region: 'EU',
    color: '#38bdf8',
    roster: lineup(['Vesper', 'Kodiak', 'Lumen', 'Arrow', 'Halcyon'], [3.2, 4.1, 5.7, 6.3, 4.4]),
  },
  {
    id: 'crown',
    name: 'Crown Theory',
    region: 'CN',
    color: '#eab308',
    roster: lineup(['Yuheng', 'Shan', 'Lingxi', 'Bai', 'Qiu'], [3.5, 3.9, 5.2, 5.9, 4.1]),
  },
  {
    id: 'phantom',
    name: 'Phantom Unit',
    region: 'NA',
    color: '#a78bfa',
    roster: lineup(['Rook', 'Wisp', 'Cipher', 'Nova', 'Atlas'], [2.9, 3.6, 4.8, 5.1, 3.9]),
  },
  {
    id: 'summit',
    name: 'Summit',
    region: 'EU',
    color: '#34d399',
    roster: lineup(['Brann', 'Fjord', 'Kaito', 'Rune', 'Ilse'], [3.1, 3.3, 4.6, 4.9, 4.2]),
  },
  {
    id: 'tide',
    name: 'Riptide',
    region: 'BR',
    color: '#22d3ee',
    roster: lineup(['Tubarão', 'Mata', 'Raio', 'Flecha', 'Escudo'], [2.7, 3.4, 4.4, 4.7, 3.6]),
  },
  {
    id: 'orbit',
    name: 'Orbit',
    region: 'NA',
    color: '#f472b6',
    roster: lineup(['Comet', 'Drift', 'Quasar', 'Ion', 'Halo'], [2.6, 3.1, 4.2, 4.5, 3.3]),
  },
  {
    id: 'grave',
    name: 'Gravewalkers',
    region: 'VN',
    color: '#94a3b8',
    roster: lineup(['Tuan', 'Bao', 'Khoa', 'Minh', 'Linh'], [2.4, 2.9, 3.8, 4.1, 3.2]),
  },
].map((team, index) => ({ ...team, seed: index + 1 }));

type Team = (typeof teams)[number];

const teamById = new Map(teams.map((team) => [team.id, team]));
const start = singleElimination(teams.map(({ id, name }) => ({ id, name })));

/** Plays one map of a best-of-three. The better seed is a little more likely to take it. */
function playMap(stage: Stage, matchId: string): Stage {
  const match = getMatch(stage, matchId);
  const [first, second] = match.slots.map((slot) => teamById.get(slot.participantId ?? ''));
  const edge = 0.5 + ((second?.seed ?? 0) - (first?.seed ?? 0)) * 0.04;
  const scores: [number, number] = [match.slots[0].score ?? 0, match.slots[1].score ?? 0];
  scores[Math.random() < edge ? 0 : 1] += 1;
  return reportResult(stage, matchId, { scores, live: Math.max(...scores) < 2 });
}

/** Opens or closes one team's roster, as a new set for React state. */
function toggled(open: Set<string>, key: string): Set<string> {
  const next = new Set(open);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export default function Esports(): ReactNode {
  const dark = useColorScheme() === 'dark';
  const [stage, setStage] = useState(start);
  const [playing, setPlaying] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [page, setPage] = useState(0);
  // Rosters open, by match and slot, so a team can be open in one round and closed in the next.
  const [open, setOpen] = useState(() => new Set<string>());
  const matches = allMatches(stage);
  const final = matches.at(-1);
  const champion =
    final?.winner != null ? teamById.get(final.slots[final.winner].participantId ?? '') : undefined;

  // A series in progress: one map at a time.
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const next = playMap(stage, playing);
      setStage(next);
      if (getMatch(next, playing).status === 'completed') setPlaying(null);
    }, 700);
    return () => clearTimeout(timer);
  }, [stage, playing]);

  // Playing the whole bracket: the next series starts once one ends.
  useEffect(() => {
    if (!auto || playing) return;
    const next = matches.find((match) => match.status === 'ready');
    if (next) setPlaying(next.id);
    else setAuto(false);
  }, [auto, playing, matches]);

  // The view follows the series being played.
  useEffect(() => {
    const index = start.groups[0]?.rounds.findIndex((round) =>
      round.matches.some((match) => match.id === playing),
    );
    if (index !== undefined && index >= 0) setPage(index);
  }, [playing]);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          primary
          label="Play all"
          disabled={auto || champion !== undefined}
          onPress={() => setAuto(true)}
        />
        <Button
          label="Replay"
          onPress={() => {
            setStage(start);
            setPlaying(null);
            setAuto(false);
            setPage(0);
            setOpen(new Set());
          }}
        />
      </View>
      {champion && (
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: champion.color,
            backgroundColor: `${champion.color}1f`,
          }}
        >
          <Text style={{ fontSize: 15, color: dark ? '#fafafa' : '#18181b' }}>
            🏆 <Text style={{ fontWeight: '700' }}>{champion.name}</Text> are the Rift Masters
            champions.
          </Text>
        </View>
      )}
      <Bracket
        stage={stage}
        page={page}
        onPageChange={setPage}
        theme={{ radius: 14, connectorRadius: 10, colors: { accent: '#7c3aed' } }}
        renderMatch={(match) => (
          <SeriesCard
            match={match}
            dark={dark}
            open={open}
            onToggle={(key) => setOpen(toggled(open, key))}
            onPlay={() => setPlaying(match.id)}
          />
        )}
      />
    </View>
  );
}

/** A best-of-three: two maps win it. */
function SeriesCard({
  match,
  dark,
  open,
  onToggle,
  onPlay,
}: {
  match: Match;
  dark: boolean;
  open: Set<string>;
  onToggle: (key: string) => void;
  onPlay: () => void;
}): ReactNode {
  const maps = (match.slots[0].score ?? 0) + (match.slots[1].score ?? 0);
  const muted = dark ? '#a1a1aa' : '#71717a';
  return (
    <Bracket.Match
      style={({ live }) => ({
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: live ? '#7c3aed' : dark ? '#27272a' : '#e4e4e7',
        backgroundColor: dark ? '#111113' : '#ffffff',
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingTop: 8,
        }}
      >
        <Text style={{ fontSize: 11, color: muted }}>Best of 3</Text>
        {match.status === 'ready' ? (
          <Pressable onPress={onPlay} hitSlop={8}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed' }}>▶ Play series</Text>
          </Pressable>
        ) : (
          <Text
            style={{
              fontSize: 11,
              fontWeight: match.status === 'live' ? '700' : '400',
              color: match.status === 'live' ? '#7c3aed' : muted,
            }}
          >
            {match.status === 'live'
              ? `Map ${maps + 1}`
              : match.status === 'completed'
                ? 'Final'
                : 'Upcoming'}
          </Text>
        )}
      </View>
      {([0, 1] as const).map((slot) => {
        const team = teamById.get(match.slots[slot].participantId ?? '');
        const key = `${match.id}.${slot}`;
        return (
          <View key={slot}>
            <Bracket.Participant slot={slot} style={{ paddingVertical: 7 }}>
              {({ slot: { score }, loser }) => (
                <>
                  <Text style={{ width: 12, fontSize: 11, color: muted }}>{team?.seed}</Text>
                  <Logo team={team} dark={dark} />
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: '600',
                      color: loser || !team ? muted : dark ? '#fafafa' : '#18181b',
                    }}
                  >
                    {team?.name ?? 'To be decided'}
                  </Text>
                  <Maps won={score ?? 0} color={team?.color ?? muted} dark={dark} />
                  {/* Gesture Handler's Pressable, so a tap here wins over the row's own press. */}
                  {team && (
                    <Pressable
                      onPress={() => onToggle(key)}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`${team.name} roster`}
                      accessibilityState={{ expanded: open.has(key) }}
                    >
                      <Chevron open={open.has(key)} color={muted} dark={dark} />
                    </Pressable>
                  )}
                </>
              )}
            </Bracket.Participant>
            {team && open.has(key) && <Roster team={team} dark={dark} />}
          </View>
        );
      })}
    </Bracket.Match>
  );
}

function Logo({ team, dark }: { team: Team | undefined; dark: boolean }): ReactNode {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: team ? team.color : dark ? '#27272a' : '#e4e4e7',
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>{team?.name[0]}</Text>
    </View>
  );
}

/** A round button with a drawn chevron that turns to point up while the roster is open. */
function Chevron({
  open,
  color,
  dark,
}: {
  open: boolean;
  color: string;
  dark: boolean;
}): ReactNode {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: open ? (dark ? '#27272a' : '#f4f4f5') : 'transparent',
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          marginTop: open ? 3 : -3,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: open ? '225deg' : '45deg' }],
        }}
      />
    </View>
  );
}

/** Two pips: a filled one for each map won. */
function Maps({ won, color, dark }: { won: number; color: string; dark: boolean }): ReactNode {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[0, 1].map((map) => (
        <View
          key={map}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: map < won ? color : dark ? '#3f3f46' : '#d4d4d8',
          }}
        />
      ))}
    </View>
  );
}

/** A team's five players, faded in as the card opens; the bracket makes room around it. */
function Roster({ team, dark }: { team: Team; dark: boolean }): ReactNode {
  return (
    <Animated.View
      entering={FadeIn.duration(260)}
      style={{
        marginHorizontal: 12,
        marginBottom: 8,
        paddingVertical: 4,
        borderTopWidth: 1,
        borderColor: dark ? '#27272a' : '#f4f4f5',
      }}
    >
      <Text style={{ paddingVertical: 4, fontSize: 11, color: dark ? '#a1a1aa' : '#71717a' }}>
        From the {team.region} league
      </Text>
      {team.roster.map(({ player, role, kda }) => (
        <View
          key={player}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}
        >
          <Text style={{ width: 52, fontSize: 11, color: team.color, fontWeight: '700' }}>
            {role}
          </Text>
          <Text style={{ flex: 1, fontSize: 13, color: dark ? '#e4e4e7' : '#27272a' }}>
            {player}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: dark ? '#a1a1aa' : '#71717a',
              fontVariant: ['tabular-nums'],
            }}
          >
            {kda.toFixed(1)} KDA
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

function Button({
  label,
  primary,
  disabled,
  onPress,
}: {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}): ReactNode {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 999,
        opacity: disabled ? 0.45 : 1,
        backgroundColor: primary ? '#7c3aed' : 'rgba(127, 127, 127, 0.16)',
      }}
    >
      <Text style={{ fontWeight: '600', color: primary ? '#ffffff' : '#7c3aed' }}>{label}</Text>
    </Pressable>
  );
}
