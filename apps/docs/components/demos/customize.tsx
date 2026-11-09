'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useState } from 'react';
import {
  Bracket,
  type ConnectorState,
  type Participant,
  singleElimination,
  useBracket,
} from 'react-brackets';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { play, teams } from './data';

const stage = play(singleElimination(teams(8)), 0.45);
const compact = { compactBelow: 0, style: { ['--rb-match-width' as string]: '9.5rem' } };

/** `useId` output made safe for `url(#…)` references. */
const useSvgId = () => useId().replace(/[^\w-]/g, '');

const shapes = {
  elbow: { label: 'Elbow', radius: 0, d: undefined },
  rounded: { label: 'Rounded', radius: 10, d: undefined },
  curve: { label: 'Curve', radius: 0, d: curve },
  straight: { label: 'Straight', radius: 0, d: straight },
} satisfies Record<
  string,
  { label: string; radius: number; d: ((line: ConnectorState) => string) | undefined }
>;

function curve({ start, end }: ConnectorState): string {
  const mid = (start.x + end.x) / 2;
  return `M${start.x},${start.y} C${mid},${start.y} ${mid},${end.y} ${end.x},${end.y}`;
}

function straight({ start, end }: ConnectorState): string {
  return `M${start.x},${start.y} L${end.x},${end.y}`;
}

export function LineShapesDemo() {
  const [shape, setShape] = useState<keyof typeof shapes>('curve');
  const { radius, d } = shapes[shape];

  return (
    <div className="flex flex-col gap-5">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        className="self-start"
        value={shape}
        onValueChange={(next) => next && setShape(next as keyof typeof shapes)}
      >
        {Object.entries(shapes).map(([key, option]) => (
          <ToggleGroupItem key={key} value={key} className="px-3">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Bracket
        {...compact}
        stage={stage}
        connectorRadius={radius}
        renderConnector={d && ((line) => <Bracket.Connector d={d(line)} />)}
      />
    </div>
  );
}

export function DashedDemo() {
  return (
    <Bracket
      {...compact}
      stage={stage}
      connectorRadius={8}
      renderConnector={({ status }) => (
        <Bracket.Connector strokeDasharray={status === 'completed' ? undefined : '3 5'} />
      )}
    />
  );
}

export function ArrowsDemo() {
  const id = useSvgId();

  return (
    <Bracket
      {...compact}
      stage={stage}
      connectorRadius={8}
      connectorDefs={
        <>
          <Arrowhead id={`${id}-line`} className="fill-[var(--rb-line)]" />
          <Arrowhead id={`${id}-accent`} className="fill-[var(--rb-accent)]" />
        </>
      }
      renderConnector={({ highlighted }) => (
        <Bracket.Connector markerEnd={`url(#${id}-${highlighted ? 'accent' : 'line'})`} />
      )}
    />
  );
}

function Arrowhead({ id, className }: { id: string; className: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      markerUnits="userSpaceOnUse"
      orient="auto"
    >
      <path d="M0,0 L10,5 L0,10 z" className={className} />
    </marker>
  );
}

export function GradientDemo() {
  const id = useSvgId();

  return (
    <Bracket
      {...compact}
      stage={stage}
      connectorRadius={10}
      renderConnector={(line) => {
        const gradient = `${id}-${line.from.id}`.replace(/\W/g, '-');
        return (
          <>
            <linearGradient
              id={gradient}
              gradientUnits="userSpaceOnUse"
              x1={line.start.x}
              y1={line.start.y}
              x2={line.end.x}
              y2={line.end.y}
            >
              <stop offset="0" stopColor="var(--rb-line)" stopOpacity="0.2" />
              <stop
                offset="1"
                stopColor={line.status === 'completed' ? 'var(--rb-accent)' : 'var(--rb-line)'}
              />
            </linearGradient>
            <Bracket.Connector style={{ stroke: `url(#${gradient})`, strokeWidth: 2 }} />
          </>
        );
      }}
    />
  );
}

const finalists = play(singleElimination(teams(8)), 0.8);
const finalist = finalists.groups[0]?.rounds.at(-1)?.matches[0]?.slots[0].participantId ?? null;

export function FlowDemo() {
  return (
    <>
      <style>{'@keyframes line-flow { to { stroke-dashoffset: -16; } }'}</style>
      <Bracket
        {...compact}
        stage={finalists}
        connectorRadius={8}
        highlighted={finalist}
        classNames={{
          connector:
            'data-highlighted:[stroke-dasharray:8_8] data-highlighted:animate-[line-flow_0.6s_linear_infinite] motion-reduce:animate-none',
        }}
      />
    </>
  );
}

const crests: Record<string, { seed: number; colour: string }> = Object.fromEntries(
  teams(8).map((team, index) => [
    team.id,
    { seed: index + 1, colour: ['#1e3f8c', '#0f766e', '#b45309', '#7c3aed'][index % 4] ?? '' },
  ]),
);

const seeded: Participant[] = teams(8).map((team) => ({ ...team, meta: crests[team.id] }));
const seededStage = play(singleElimination(seeded), 0.45);

export function MetaCardDemo() {
  return (
    <Bracket
      stage={seededStage}
      compactBelow={0}
      connectorRadius={10}
      renderMatch={() => (
        <Bracket.Match className="w-56 overflow-hidden rounded-xl border bg-card shadow-xs">
          {([0, 1] as const).map((slot) => (
            <Bracket.Participant
              key={slot}
              slot={slot}
              className="flex items-center gap-2.5 px-3 py-2 text-sm not-first:border-t data-loser:opacity-60"
            >
              {({ participant, winner, slot: { score } }) => {
                const meta = participant?.meta as { seed: number; colour: string } | undefined;
                return (
                  <>
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: meta?.colour ?? 'var(--muted)' }}
                    >
                      {participant?.name[0] ?? ''}
                    </span>
                    <span className={cn('flex-1 truncate', winner && 'font-semibold')}>
                      {participant?.name ?? 'To be decided'}
                    </span>
                    {meta && <span className="text-xs text-muted-foreground">#{meta.seed}</span>}
                    <span className="w-4 text-end tabular-nums">{score ?? ''}</span>
                  </>
                );
              }}
            </Bracket.Participant>
          ))}
        </Bracket.Match>
      )}
    />
  );
}

const schedule = ['Fri 12 June', 'Sat 13 June', 'Sun 14 June'];

export function RoundTitlesDemo() {
  return (
    <Bracket.Root stage={stage} compactBelow={0}>
      <Bracket.Viewport>
        <Bracket.Rounds>
          {(column, index) => (
            <Bracket.Round>
              <Bracket.RoundTitle className="flex flex-col gap-0.5 pb-3">
                <span className="font-semibold">{column.round.name}</span>
                <span className="text-xs font-normal normal-case tracking-normal text-muted-foreground">
                  {schedule[index]}, best of {index === 2 ? 5 : 3}
                </span>
              </Bracket.RoundTitle>
              <Bracket.Matches />
            </Bracket.Round>
          )}
        </Bracket.Rounds>
        <Bracket.Connectors radius={8} />
      </Bracket.Viewport>
    </Bracket.Root>
  );
}

export function CustomPaginationDemo() {
  return (
    <Bracket.Root stage={stage} compactBelow={10_000}>
      <RoundStepper />
      <Bracket.Viewport>
        <Bracket.Rounds />
        <Bracket.Connectors radius={6} />
      </Bracket.Viewport>
    </Bracket.Root>
  );
}

function RoundStepper() {
  const { rounds, page, setPage } = useBracket();
  const round = rounds[page];

  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        aria-label="Previous round"
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
        className="grid size-8 place-items-center rounded-full border disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="flex flex-1 flex-col gap-1.5">
        <span className="text-center text-sm font-semibold">{round?.name}</span>
        <div className="flex gap-1">
          {rounds.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                'h-1 flex-1 rounded-full bg-muted transition-colors',
                index <= page && 'bg-brand',
              )}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Next round"
        disabled={page === rounds.length - 1}
        onClick={() => setPage(page + 1)}
        className="grid size-8 place-items-center rounded-full border disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
