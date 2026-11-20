import { useState } from 'react';
import {
  allMatches,
  type Id,
  participantMap,
  reportResult,
  type Stage,
  singleElimination,
} from 'react-brackets';
import styles from './app.module.css';
import { hue, isOut, linkPath, rings, type Spot } from './rings';
import { scoresFor, teams } from './teams';

const SIZE = 640;

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
 * the tournament; this file only draws it, in plain SVG.
 */
export function App() {
  const [stage, setStage] = useState(start);
  const [focus, setFocus] = useState<Id | null>(null);
  const names = participantMap(stage);
  const layout = rings(stage, SIZE);
  const { spots, links, middle } = layout;
  const champion = spots[middle]?.[0]?.participantId;
  const next = allMatches(stage).find((match) => match.status === 'ready');
  const lit = (spot: Spot) => focus !== null && spot.participantId === focus;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h2 className={styles.title}>Champions Cup</h2>
        <p className={styles.meta} aria-live="polite">
          {champion
            ? `${names.get(champion)?.name} win the cup.`
            : 'Hover or focus a team to follow its path.'}
        </p>
      </header>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={styles.rings}
        role="img"
        aria-label="A 32-team bracket drawn as rings, with the champion in the middle"
      >
        <defs>
          <radialGradient id="radial-glow">
            <stop offset="0%" stopColor="#f5b84a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f5b84a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE * 0.28} fill="url(#radial-glow)" />

        {links.map((link) => (
          <path
            key={`${link.from.ring}.${link.from.index}`}
            d={linkPath(link, SIZE)}
            className={styles.link}
            data-lit={(lit(link.from) && lit(link.to)) || undefined}
          />
        ))}

        {spots.flat().map((spot) => {
          const key = `${spot.ring}.${spot.index}`;
          const size = spot.ring === middle ? 36 : 12 + spot.ring * 2.5;
          const team = spot.participantId ? names.get(spot.participantId) : undefined;
          if (!team) {
            return (
              <circle key={key} cx={spot.x} cy={spot.y} r={size * 0.75} className={styles.empty} />
            );
          }
          return (
            // biome-ignore lint/a11y/useSemanticElements: an SVG group has no button element to use
            <g
              key={key}
              role="button"
              tabIndex={0}
              aria-label={team.name}
              className={styles.team}
              data-out={(isOut(spot, layout) && !lit(spot)) || undefined}
              data-lit={lit(spot) || undefined}
              onPointerEnter={() => setFocus(team.id)}
              onPointerLeave={() => setFocus(null)}
              onFocus={() => setFocus(team.id)}
              onBlur={() => setFocus(null)}
            >
              <title>{team.name}</title>
              <circle
                cx={spot.x}
                cy={spot.y}
                r={size}
                fill={`hsl(${hue(team.id)} 48% 52%)`}
                data-champion={spot.ring === middle || undefined}
              />
              <text x={spot.x} y={spot.y} dy="0.35em" fontSize={size * 0.8}>
                {team.name.slice(0, 2)}
              </text>
            </g>
          );
        })}

        {champion && (
          <text x={SIZE / 2} y={SIZE / 2 - 50} className={styles.trophy} aria-hidden>
            🏆
          </text>
        )}
      </svg>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={!next}
          onClick={() =>
            next && setStage(reportResult(stage, next.id, { scores: scoresFor(next.id) }))
          }
        >
          Next result
        </button>
        <button type="button" className={styles.button} onClick={() => setStage(start())}>
          Start over
        </button>
      </div>
    </div>
  );
}
