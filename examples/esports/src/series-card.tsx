import { ChevronDown, Play } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Bracket, type Match } from 'react-brackets';
import styles from './app.module.css';
import { roles, teamById } from './teams';

interface SeriesCardProps {
  match: Match;
  /** Which teams have their roster open: 0, 1, both or neither. */
  open: Set<0 | 1>;
  onToggle: (slot: 0 | 1) => void;
  onPlay: () => void;
}

/** A best-of-three: two maps win it. */
export function SeriesCard({ match, open, onToggle, onPlay }: SeriesCardProps) {
  const maps = (match.slots[0].score ?? 0) + (match.slots[1].score ?? 0);

  return (
    <Bracket.Match className={styles.card}>
      <header className={styles.cardHeader}>
        <span>Best of 3</span>
        {match.status === 'live' ? (
          <span className={styles.live}>Map {maps + 1}</span>
        ) : (
          <span>{match.status === 'completed' ? 'Final' : 'Upcoming'}</span>
        )}
      </header>
      {([0, 1] as const).map((slot) => (
        <Bracket.Participant key={slot} slot={slot} className={styles.team}>
          {({ participant, slot: { score } }) => {
            const team = participant && teamById.get(participant.id);
            const Logo = team?.icon;
            return (
              <>
                <button
                  type="button"
                  className={styles.row}
                  disabled={!team}
                  aria-expanded={team ? open.has(slot) : undefined}
                  onClick={() => onToggle(slot)}
                  style={{ '--team': team?.color } as CSSProperties}
                >
                  <span className={styles.seed}>{team?.seed}</span>
                  <span className={styles.logo}>{Logo && <Logo size={14} />}</span>
                  <span className={styles.name}>{team?.name ?? 'To be decided'}</span>
                  {team && <span className={styles.region}>{team.region}</span>}
                  <span className={styles.pips} role="img" aria-label={`${score ?? 0} maps won`}>
                    {[0, 1].map((map) => (
                      <span key={map} data-won={map < (score ?? 0) || undefined} />
                    ))}
                  </span>
                  {team && <ChevronDown size={14} className={styles.chevron} />}
                </button>
                {team && (
                  <div className={styles.roster} data-open={open.has(slot) || undefined}>
                    <ul>
                      {team.roster.map(({ player, role, kda }) => {
                        const Role = roles[role].icon;
                        return (
                          <li key={player}>
                            <Role size={12} aria-label={roles[role].name} />
                            <span>{player}</span>
                            <span className={styles.kda}>{kda.toFixed(1)} KDA</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            );
          }}
        </Bracket.Participant>
      ))}
      {match.status === 'ready' && (
        <button type="button" className={styles.play} onClick={onPlay}>
          <Play size={12} />
          Play series
        </button>
      )}
    </Bracket.Match>
  );
}
