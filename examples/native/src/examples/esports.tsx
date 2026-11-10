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
import { Pressable, Text, useColorScheme, View } from 'react-native';

/** Listed by seed, so the favourites meet as late as possible. */
const teams = [
  { id: 'ember', name: 'Ember Kings', region: 'KR', color: '#f97316' },
  { id: 'frost', name: 'Frostline', region: 'EU', color: '#38bdf8' },
  { id: 'crown', name: 'Crown Theory', region: 'CN', color: '#eab308' },
  { id: 'phantom', name: 'Phantom Unit', region: 'NA', color: '#a78bfa' },
  { id: 'summit', name: 'Summit', region: 'EU', color: '#34d399' },
  { id: 'tide', name: 'Riptide', region: 'BR', color: '#22d3ee' },
  { id: 'orbit', name: 'Orbit', region: 'NA', color: '#f472b6' },
  { id: 'grave', name: 'Gravewalkers', region: 'VN', color: '#94a3b8' },
].map((team, index) => ({ ...team, seed: index + 1 }));

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

export default function Esports(): ReactNode {
  const dark = useColorScheme() === 'dark';
  const [stage, setStage] = useState(start);
  const [playing, setPlaying] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [page, setPage] = useState(0);
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
          <SeriesCard match={match} dark={dark} onPlay={() => setPlaying(match.id)} />
        )}
      />
    </View>
  );
}

/** A best-of-three: two maps win it. */
function SeriesCard({
  match,
  dark,
  onPlay,
}: {
  match: Match;
  dark: boolean;
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
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant key={slot} slot={slot} style={{ paddingVertical: 7 }}>
          {({ participant, slot: { score }, loser }) => {
            const team = participant && teamById.get(participant.id);
            return (
              <>
                <Text style={{ width: 12, fontSize: 11, color: muted }}>{team?.seed}</Text>
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
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>
                    {team?.name[0]}
                  </Text>
                </View>
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
                {team && <Text style={{ fontSize: 10, color: muted }}>{team.region}</Text>}
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  {[0, 1].map((map) => (
                    <View
                      key={map}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor:
                          map < (score ?? 0)
                            ? (team?.color ?? muted)
                            : dark
                              ? '#3f3f46'
                              : '#d4d4d8',
                      }}
                    />
                  ))}
                </View>
              </>
            );
          }}
        </Bracket.Participant>
      ))}
    </Bracket.Match>
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
