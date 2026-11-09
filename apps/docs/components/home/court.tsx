import { teams } from '@/components/demos/data';
import { cn } from '@/lib/utils';

/** Each team keeps one colour across the page, so you can follow it round to round. */
const colours = [
  '#7dd3fc',
  '#fda4af',
  '#fcd34d',
  '#86efac',
  '#c4b5fd',
  '#fdba74',
  '#5eead4',
  '#f9a8d4',
];
const colourOf = new Map(
  teams(32).map((team, index) => [team.id, colours[index % colours.length]]),
);

export function teamColour(id: string | undefined): string {
  return (id && colourOf.get(id)) || 'var(--chip-empty, rgb(255 255 255 / 0.12))';
}

/** A square team badge with the team's initial, in its colour. */
export function TeamChip({
  id,
  name,
  className,
}: {
  id: string | undefined;
  name: string | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-[5px] text-[11px] font-bold text-[#10213f]',
        className,
      )}
      style={{ background: teamColour(id) }}
    >
      {name?.[0]}
    </span>
  );
}

/** A pulsing dot for a match in progress. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('relative inline-flex size-2', className)}>
      <span className="absolute inset-0 rounded-full bg-white motion-safe:animate-ping motion-safe:opacity-60" />
      <span className="relative size-full rounded-full bg-white" />
    </span>
  );
}

// A tennis court in perspective, measured in metres and projected from a camera behind the near baseline.
const LENGTH = 23.77;
const DOUBLES = 5.485;
const SINGLES = 4.115;
const SERVICE = 6.4;
const VIEW = { width: 1440, height: 1600 };

function project(x: number, d: number, centre: number): [number, number] {
  const depth = d + 8;
  return [centre + (1506 * x) / depth, -273.7 + 12190 / depth];
}

function line(from: [number, number], to: [number, number], centre: number): string {
  const [x1, y1] = project(from[0], from[1], centre);
  const [x2, y2] = project(to[0], to[1], centre);
  return `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`;
}

function courtPaths(centre: number) {
  const net = LENGTH / 2;
  const surface = [
    project(-DOUBLES - 3, -2, centre),
    project(-DOUBLES - 3, LENGTH + 4, centre),
    project(DOUBLES + 3, LENGTH + 4, centre),
    project(DOUBLES + 3, -2, centre),
  ]
    .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join('');
  const lines = [
    line([-DOUBLES, 0], [-DOUBLES, LENGTH], centre),
    line([DOUBLES, 0], [DOUBLES, LENGTH], centre),
    line([-SINGLES, 0], [-SINGLES, LENGTH], centre),
    line([SINGLES, 0], [SINGLES, LENGTH], centre),
    line([-DOUBLES, LENGTH], [DOUBLES, LENGTH], centre),
    line([-DOUBLES, 0], [DOUBLES, 0], centre),
    line([-SINGLES, net - SERVICE], [SINGLES, net - SERVICE], centre),
    line([-SINGLES, net + SERVICE], [SINGLES, net + SERVICE], centre),
    line([0, net - SERVICE], [0, net + SERVICE], centre),
    line([0, LENGTH], [0, LENGTH - 0.3], centre),
  ].join('');
  // The net stands 0.914 m tall at the posts; project its foot and its tape.
  const [left, foot] = project(-DOUBLES - 0.9, net, centre);
  const [right] = project(DOUBLES + 0.9, net, centre);
  const height = (1506 * 0.914) / (net + 8);
  return {
    surface: `${surface}Z`,
    lines,
    net: { x: left, y: foot - height, width: right - left, height },
  };
}

const centred = courtPaths(1000);

/**
 * The hard court the hero is played on, seen from behind the baseline. Drawn at a fixed size from the top and never
 * stretched, so it stays put while anything in front of it changes height.
 */
export function CourtPlan({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-[260px] left-1/2 -translate-x-1/2 sm:top-[195px]',
        className,
      )}
      width={VIEW.width}
      height={VIEW.height}
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      fill="none"
    >
      <path d={centred.surface} fill="var(--court)" />
      <path d={centred.lines} stroke="white" strokeOpacity="0.2" strokeWidth="2" />
      <defs>
        <pattern id="court-net" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0,0L7,7M7,0L0,7" stroke="white" strokeOpacity="0.1" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect {...centred.net} fill="rgb(5 12 30 / 0.28)" />
      <rect {...centred.net} fill="url(#court-net)" />
      <path
        d={`M${centred.net.x},${centred.net.y}h${centred.net.width}`}
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="3"
      />
      <path
        d={`M${centred.net.x},${centred.net.y - 4}v${centred.net.height + 4}M${centred.net.x + centred.net.width},${centred.net.y - 4}v${centred.net.height + 4}`}
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="4"
      />
    </svg>
  );
}
