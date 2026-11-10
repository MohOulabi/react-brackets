import { BellRing, ChevronDown, Link2, MapPin, Star } from 'lucide-react';
import { Bracket, type Match } from 'react-brackets';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './components/ui/context-menu';
import { type Fixture, fixtures, nationById } from './data';
import { cn } from './lib/utils';

export interface CardSettings {
  flags: boolean;
  seeds: boolean;
  minute: number;
}

interface MatchCardProps {
  match: Match;
  settings: CardSettings;
  expanded: boolean;
  reminder: boolean;
  copied: boolean;
  onToggle: () => void;
  onRemind: (on: boolean) => void;
  onFollow: (nationId: string) => void;
  onCopy: () => void;
}

export function MatchCard({
  match,
  settings,
  expanded,
  reminder,
  copied,
  onToggle,
  onRemind,
  onFollow,
  onCopy,
}: MatchCardProps) {
  const fixture = fixtures[match.id];
  const live = match.status === 'live';
  const sides = match.slots.map((slot) =>
    slot.participantId ? nationById.get(slot.participantId) : undefined,
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Bracket.Match
          className={cn(
            'overflow-hidden rounded-xl border bg-card text-sm shadow-xs transition-shadow data-[state=open]:ring-2 data-[state=open]:ring-brand/40',
            live && 'border-red-500/50 bg-linear-to-br from-red-500/10 via-card to-card',
          )}
        >
          <header className="flex items-center justify-between px-3 pt-2.5 pb-1 text-[11px] text-muted-foreground">
            <span>
              {fixture?.day}, {fixture?.time}
            </span>
            <span className="flex items-center gap-1.5">
              {reminder && <BellRing className="size-3 animate-in text-brand zoom-in" />}
              <Status match={match} minute={settings.minute} />
            </span>
          </header>
          {([0, 1] as const).map((slot) => (
            <Bracket.Participant
              key={slot}
              slot={slot}
              className="flex items-center gap-2 px-3 py-1.5 transition-colors data-highlighted:bg-brand/10 data-loser:text-muted-foreground data-winner:font-semibold"
            >
              {({ participant, slot: { score } }) => {
                const nation = participant && nationById.get(participant.id);
                return (
                  <>
                    {settings.seeds && (
                      <span className="w-3 text-[11px] text-muted-foreground tabular-nums">
                        {nation?.seed}
                      </span>
                    )}
                    {settings.flags && (
                      <span className="text-base leading-none" aria-hidden>
                        {nation?.flag ?? '🏳️'}
                      </span>
                    )}
                    <span className="flex-1 truncate">{nation?.name ?? 'To be decided'}</span>
                    {/* Keyed by the score, so every goal pops in. */}
                    <span
                      key={score}
                      className="animate-in tabular-nums duration-500 fade-in zoom-in-50"
                    >
                      {score}
                    </span>
                  </>
                );
              }}
            </Bracket.Participant>
          ))}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="mt-1 flex w-full items-center justify-center gap-1 border-t py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {expanded ? 'Hide details' : 'Details'}
            <ChevronDown
              className={cn('size-3.5 transition-transform duration-300', expanded && 'rotate-180')}
            />
          </button>
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-300 ease-out',
              expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className="overflow-hidden">
              {fixture && <Details match={match} fixture={fixture} />}
            </div>
          </div>
        </Bracket.Match>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuLabel>
          {sides.map((nation) => nation?.name ?? 'To be decided').join(' v ')}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        {sides.map(
          (nation) =>
            nation && (
              <ContextMenuItem key={nation.id} onSelect={() => onFollow(nation.id)}>
                <Star />
                Follow {nation.name}
              </ContextMenuItem>
            ),
        )}
        <ContextMenuItem onSelect={onToggle}>
          <ChevronDown />
          {expanded ? 'Hide details' : 'Show details'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem
          checked={reminder}
          disabled={match.status === 'completed'}
          onCheckedChange={onRemind}
        >
          Remind me at kick-off
        </ContextMenuCheckboxItem>
        <ContextMenuItem onSelect={onCopy}>
          <Link2 />
          {copied ? 'Link copied' : 'Copy match link'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function Status({ match, minute }: { match: Match; minute: number }) {
  if (match.status === 'completed') return <span className="font-medium">Full time</span>;
  if (match.status !== 'live') return <span>Upcoming</span>;
  return (
    <span className="flex items-center gap-1.5 font-semibold text-red-500">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
      </span>
      {minute}'
    </span>
  );
}

function Details({ match, fixture }: { match: Match; fixture: Fixture }) {
  const started = match.status === 'completed' || match.status === 'live';
  return (
    <div className="space-y-3 border-t bg-muted/50 px-3 py-3 text-xs">
      {started && fixture.stats ? (
        <>
          <Stat label="Possession" values={fixture.stats.possession} unit="%" />
          <Stat label="Shots" values={fixture.stats.shots} />
          <Stat label="On target" values={fixture.stats.onTarget} />
          <ul className="space-y-1">
            {fixture.goals?.map((goal) => (
              <li
                key={`${goal.player}-${goal.minute}`}
                className={cn('flex gap-1.5', goal.side === 1 && 'flex-row-reverse')}
              >
                <span aria-hidden>⚽</span>
                <span className="font-medium">{goal.player}</span>
                <span className="text-muted-foreground">{goal.minute}'</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-muted-foreground">
          Kick-off {fixture.day} at {fixture.time}.
        </p>
      )}
      <p className="flex items-center gap-1 text-muted-foreground">
        <MapPin className="size-3" />
        {fixture.venue}
      </p>
    </div>
  );
}

function Stat({
  label,
  values,
  unit = '',
}: {
  label: string;
  values: [number, number];
  unit?: string;
}) {
  const [home, away] = values;
  return (
    <div className="space-y-1">
      <div className="flex justify-between tabular-nums">
        <span className="font-semibold">
          {home}
          {unit}
        </span>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {away}
          {unit}
        </span>
      </div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <div className="rounded-full bg-brand" style={{ flexGrow: home }} />
        <div className="rounded-full bg-foreground/20" style={{ flexGrow: away }} />
      </div>
    </div>
  );
}
