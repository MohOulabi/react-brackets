import { ChevronsDownUp, ChevronsUpDown, RotateCcw, SlidersHorizontal, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { allMatches, Bracket } from 'react-brackets';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { nations, play, results } from './data';
import { cn } from './lib/utils';
import { MatchCard } from './match-card';

const button =
  'inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50';

/** Adds or removes one id from a set, as a new set for React state. */
const toggled = (set: Set<string>, id: string, on = !set.has(id)) => {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
};

export function App() {
  const [shown, setShown] = useState(results.length);
  const [expanded, setExpanded] = useState(() => new Set(['main.r2.m1']));
  const [reminders, setReminders] = useState(() => new Set(['main.r3.m1']));
  const [followed, setFollowed] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [flags, setFlags] = useState(true);
  const [seeds, setSeeds] = useState(true);
  const [minute, setMinute] = useState(67);
  const stage = useMemo(() => play(shown), [shown]);
  const replaying = shown < results.length;

  // A replay brings the results back in one at a time.
  useEffect(() => {
    if (!replaying) return;
    const timer = setTimeout(() => setShown(shown + 1), 900);
    return () => clearTimeout(timer);
  }, [shown, replaying]);

  // The live match keeps playing.
  useEffect(() => {
    const timer = setInterval(() => setMinute((current) => Math.min(90, current + 1)), 2000);
    return () => clearInterval(timer);
  }, []);

  const copy = (matchId: string) => {
    navigator.clipboard?.writeText(`${location.href.split('#')[0]}#${matchId}`);
    setCopied(matchId);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Nations Cup knockouts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a match for its stats, or right-click it for more.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={button} disabled={replaying} onClick={() => setShown(0)}>
            <RotateCcw
              className={cn('size-4', replaying && 'animate-spin [animation-direction:reverse]')}
            />
            Replay
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={button}>
                <SlidersHorizontal className="size-4" />
                View
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={flags} onCheckedChange={setFlags}>
                Flags
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={seeds} onCheckedChange={setSeeds}>
                Seeds
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Star />
                  Follow a team
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuRadioGroup
                    value={followed ?? ''}
                    onValueChange={(value) => setFollowed(value || null)}
                  >
                    <DropdownMenuRadioItem value="">Nobody</DropdownMenuRadioItem>
                    {nations.map((nation) => (
                      <DropdownMenuRadioItem key={nation.id} value={nation.id}>
                        <span aria-hidden>{nation.flag}</span>
                        {nation.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setExpanded(new Set(allMatches(stage).map((match) => match.id)))}
              >
                <ChevronsUpDown />
                Open every match
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setExpanded(new Set())}>
                <ChevronsDownUp />
                Close every match
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <Bracket
        stage={stage}
        highlighted={followed ?? undefined}
        connectorRadius={10}
        className="[--rb-match-width:15rem]"
        renderMatch={(match) => (
          <MatchCard
            match={match}
            settings={{ flags, seeds, minute }}
            expanded={expanded.has(match.id)}
            reminder={reminders.has(match.id)}
            copied={copied === match.id}
            onToggle={() => setExpanded(toggled(expanded, match.id))}
            onRemind={(on) => setReminders(toggled(reminders, match.id, on))}
            onFollow={setFollowed}
            onCopy={() => copy(match.id)}
          />
        )}
      />
    </div>
  );
}
