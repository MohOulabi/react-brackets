'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Bracket, participantMap, reportResult, singleElimination } from 'react-brackets';
import { play, teams } from '@/components/demos/data';
import { LiveDot, TeamChip } from '@/components/home/court';
import { CourtCard, CourtLine } from '@/components/home/court-hero';
import { cn } from '@/lib/utils';

/**
 * A modern iPhone drawn in CSS: titanium band, side buttons, black bezel, Dynamic Island and a glass sheen.
 * Proportions follow the real 71.5 × 149.6 mm body, so the screen inside is a true phone width.
 */
export function IPhone({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="relative mx-auto aspect-[71.5/149.6] w-[340px] max-w-full select-none">
      <figcaption className="sr-only">{label}</figcaption>
      <span className="iphone-button top-[17%] left-[-2px] h-[3.6%]" />
      <span className="iphone-button top-[24.5%] left-[-2px] h-[7%]" />
      <span className="iphone-button top-[33%] left-[-2px] h-[7%]" />
      <span className="iphone-button top-[27%] right-[-2px] h-[11%]" />
      <div className="iphone-band absolute inset-0 rounded-[3.4rem] p-[3px] shadow-[0_50px_70px_-35px_rgb(16_33_63/0.55),0_20px_30px_-20px_rgb(16_33_63/0.35)]">
        <div className="h-full rounded-[3.25rem] bg-black p-[10px]">
          <div className="relative h-full overflow-hidden rounded-[2.65rem] bg-court-deep text-white [color-scheme:dark]">
            {children}
            <StatusBar />
            <span className="absolute top-[11px] left-1/2 h-[30px] w-[96px] -translate-x-1/2 rounded-full bg-black" />
            <span className="absolute bottom-2 left-1/2 h-[5px] w-[120px] -translate-x-1/2 rounded-full bg-white/80" />
            <span className="iphone-glass pointer-events-none absolute inset-0" />
          </div>
        </div>
      </div>
    </figure>
  );
}

function StatusBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[52px] items-center justify-between px-7 pt-1 text-[15px] font-semibold tabular-nums">
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
          <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .6 10.4 10.4 0 0 0 .8 3.5L2 4.8a8.6 8.6 0 0 1 6-2.4Z" />
          <path d="M8 5.9c1.4 0 2.6.5 3.6 1.4l1.2-1.3A7 7 0 0 0 8 4.1 7 7 0 0 0 3.2 6l1.2 1.3c1-.9 2.2-1.4 3.6-1.4Z" />
          <path d="M8 9.3c.5 0 1 .2 1.3.5L8 11.2 6.7 9.8c.3-.3.8-.5 1.3-.5Z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden>
          <rect
            x="0.5"
            y="0.5"
            width="23"
            height="12"
            rx="3.5"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
          <path
            d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z"
            fill="currentColor"
            fillOpacity="0.4"
          />
        </svg>
      </span>
    </div>
  );
}

const base = play(singleElimination(teams(8)), 0.45);
const firstReady = base.groups[0]?.rounds
  .flatMap((round) => round.matches)
  .find((match) => match.status === 'ready');
const phoneStage = firstReady
  ? reportResult(base, firstReady.id, { scores: [1, 1], live: true })
  : base;
const rounds = phoneStage.groups[0]?.rounds.length ?? 1;
const names = participantMap(phoneStage);
const liveMatch = phoneStage.groups[0]?.rounds
  .flatMap((round) => round.matches.map((match) => ({ round: round.name, match })))
  .find(({ match }) => match.status === 'live');

/** The match in progress, pinned to the bottom of the app like a score bug. */
function LiveNow() {
  if (!liveMatch) return null;
  const { round, match } = liveMatch;
  return (
    <div className="mx-4 mb-3 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
      <p className="flex items-center gap-2 text-[12px] text-white/60">
        <LiveDot className="size-1.5" />
        Live now, {round.toLowerCase()}
      </p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {([0, 1] as const).map((slot) => {
          const team = names.get(match.slots[slot].participantId ?? '');
          return (
            <span
              key={slot}
              className={cn(
                'flex items-center gap-2 text-[15px] font-semibold',
                slot === 1 && 'col-start-3 flex-row-reverse text-end',
              )}
            >
              <TeamChip id={team?.id} name={team?.name} className="size-6 text-[12px]" />
              {team?.name}
            </span>
          );
        })}
        <span className="col-start-2 row-start-1 font-display text-[2rem] tabular-nums">
          {match.slots[0].score}
          <span className="mx-1.5 text-white/35">:</span>
          {match.slots[1].score}
        </span>
      </div>
    </div>
  );
}

/**
 * Pages through the rounds on its own while the phone is on screen, the way a thumb would, until someone swipes or
 * taps it themselves. Stays still for people who prefer reduced motion.
 */
function useDemoPaging() {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (touched || !element || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearInterval(timer);
        if (entry?.isIntersecting)
          timer = setInterval(() => setPage((current) => (current + 1) % rounds), 2600);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [touched]);

  return {
    ref,
    page,
    onPageChange: (next: number) => {
      setTouched(true);
      setPage(next);
    },
  };
}

export function PhoneShowcase() {
  const { ref, page, onPageChange } = useDemoPaging();

  return (
    <IPhone label="An iPhone showing the Spring Cup bracket one round at a time, with the next round peeking in at the edge">
      <div ref={ref} className="absolute inset-0 flex flex-col pt-[60px] pb-5">
        <div className="flex items-end justify-between px-5 pb-4">
          <div>
            <p className="text-[13px] text-white/55">Sunday, 14 April</p>
            <p className="font-display text-[2rem]">Spring Cup</p>
          </div>
          <span className="mb-1 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium text-white/80">
            8 teams
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4">
          <Bracket
            className="court-bracket phone-bracket"
            stage={phoneStage}
            page={page}
            onPageChange={onPageChange}
            connectorRadius={6}
            highlightOnHover={false}
            renderMatch={(match) => <CourtCard match={match} />}
            renderConnector={(line) => <CourtLine line={line} />}
          />
        </div>
        <LiveNow />
      </div>
    </IPhone>
  );
}
