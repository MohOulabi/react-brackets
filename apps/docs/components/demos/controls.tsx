'use client';

import { ChevronLeft, ChevronRight, Maximize, Minus, Plus, Scan, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import {
  Bracket,
  singleElimination,
  usePagination,
  useZoom,
  type ZoomOptions,
} from 'react-brackets';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { play, teams } from './data';
import { Phone } from './preview';

const stage = play(singleElimination(teams(8)), 0.45);
const big = play(singleElimination(teams(16)), 0.3);
const phone = { compactBelow: 10_000 };

/** The bracket's rounds and lines, shared by every demo here. */
function Drawing({ mode }: { mode?: 'pan-zoom' }) {
  return (
    <Bracket.Viewport mode={mode} controls={false}>
      <Bracket.Rounds />
      <Bracket.Connectors radius={8} />
    </Bracket.Viewport>
  );
}

/** Pills that slide under the round in focus, between round arrows. */
export function PillsDemo() {
  return (
    <Phone>
      <Bracket.Root stage={stage} {...phone}>
        <Drawing />
        <Bracket.Pagination className="mt-4 flex items-center gap-1">
          <Bracket.PreviousPage className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30">
            <ChevronLeft className="size-4" />
          </Bracket.PreviousPage>
          <div className="relative flex flex-1 justify-between">
            <Bracket.PageIndicator className="top-0 bottom-0 z-0 rounded-full bg-brand/12 ring-1 ring-brand/25" />
            {stage.groups[0]?.rounds.map((round, index) => (
              <Bracket.PageButton
                key={round.id}
                index={index}
                className={({ active }) =>
                  cn(
                    'relative rounded-full border-transparent bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-transparent',
                    active && 'text-brand',
                  )
                }
              />
            ))}
          </div>
          <Bracket.NextPage className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30">
            <ChevronRight className="size-4" />
          </Bracket.NextPage>
        </Bracket.Pagination>
      </Bracket.Root>
    </Phone>
  );
}

/** A title with progress above the bracket, and dots below it, from `usePagination()`. */
export function DotsDemo() {
  return (
    <Phone>
      <Bracket.Root stage={stage} {...phone}>
        <RoundHeader />
        <Drawing />
        <Dots />
      </Bracket.Root>
    </Phone>
  );
}

function RoundHeader() {
  const { rounds, page, previous, next, canPrevious, canNext } = usePagination();
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-muted-foreground">
          Round {page + 1} of {rounds.length}
        </p>
        <p className="font-semibold">{rounds[page]?.name}</p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          aria-label="Previous round"
          disabled={!canPrevious}
          onClick={previous}
          className="grid size-8 place-items-center rounded-full border disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next round"
          disabled={!canNext}
          onClick={next}
          className="grid size-8 place-items-center rounded-full border disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Dots() {
  const { rounds, position, setPage } = usePagination();
  return (
    <div className="mt-4 flex justify-center gap-2">
      {rounds.map((round, index) => (
        <button
          key={round.id}
          type="button"
          aria-label={round.name}
          aria-current={index === position ? 'step' : undefined}
          onClick={() => setPage(index)}
          className={cn(
            'h-2 rounded-full bg-muted-foreground/25 transition-all duration-300',
            index === position ? 'w-6 bg-brand' : 'w-2',
          )}
        />
      ))}
    </div>
  );
}

/** A toolbar above the bracket: zoom out, a slider, zoom in, the level, zoom to the largest, and fit. */
export function ZoomToolbarDemo() {
  return (
    <Bracket.Root stage={big} compactBelow={0} zoom={{ maxScale: 2.5 }}>
      <ZoomToolbar />
      <Drawing mode="pan-zoom" />
    </Bracket.Root>
  );
}

function ZoomToolbar() {
  const zoom = useZoom();
  if (!zoom) return null;
  const button =
    'grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30';
  return (
    <div className="mb-3 flex items-center gap-2 rounded-lg border bg-card p-1.5">
      <Bracket.ZoomOut className={button}>
        <Minus className="size-4" />
      </Bracket.ZoomOut>
      <Slider
        aria-label="Zoom"
        className="max-w-48 flex-1"
        min={zoom.minScale}
        max={zoom.maxScale}
        step={0.01}
        value={[zoom.scale]}
        onValueChange={([scale]) => scale !== undefined && zoom.zoomTo(scale)}
      />
      <Bracket.ZoomIn className={button}>
        <Plus className="size-4" />
      </Bracket.ZoomIn>
      <Bracket.ZoomLevel className="w-12 text-center text-xs font-semibold tabular-nums" />
      <span className="mx-1 h-5 w-px bg-border" />
      <button
        type="button"
        className={button}
        aria-label="Zoom to the largest"
        disabled={!zoom.canZoomIn}
        onClick={() => zoom.zoomTo(zoom.maxScale)}
      >
        <ZoomIn className="size-4" />
      </button>
      <Bracket.ZoomReset className={button}>
        <Scan className="size-4" />
      </Bracket.ZoomReset>
    </div>
  );
}

/** Round floating buttons stacked over the bracket's corner, through `renderZoomControls`. */
export function FloatingZoomDemo() {
  const round =
    'grid size-10 place-items-center rounded-full border bg-card shadow-md transition-colors hover:bg-accent disabled:opacity-40';
  return (
    <div className="relative">
      <Bracket
        stage={big}
        compactBelow={0}
        mode="pan-zoom"
        connectorRadius={8}
        renderZoomControls={() => (
          <Bracket.ZoomControls className="absolute top-3 right-3 flex flex-col gap-2">
            <Bracket.ZoomIn className={round}>
              <Plus className="size-4" />
            </Bracket.ZoomIn>
            <Bracket.ZoomOut className={round}>
              <Minus className="size-4" />
            </Bracket.ZoomOut>
            <Bracket.ZoomReset className={round}>
              <Maximize className="size-4" />
            </Bracket.ZoomReset>
          </Bracket.ZoomControls>
        )}
      />
    </div>
  );
}

const feels = {
  default: { label: 'Default', zoom: {} },
  firm: { label: 'Hard edges', zoom: { elasticity: 0, momentum: false } },
  loose: { label: 'Loose', zoom: { elasticity: 1, momentum: { deceleration: 0.999 } } },
  centred: { label: 'Centred, zoomed in', zoom: { align: 'center', initial: 1, doubleTap: 1.5 } },
} satisfies Record<string, { label: string; zoom: ZoomOptions }>;

/** The same tree with different `zoom` options, to drag, flick and double tap. */
export function ZoomFeelDemo() {
  const [feel, setFeel] = useState<keyof typeof feels>('default');
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        value={feel}
        onValueChange={(value) => value && setFeel(value as keyof typeof feels)}
        variant="outline"
        size="sm"
        className="flex-wrap"
      >
        {Object.entries(feels).map(([key, { label }]) => (
          <ToggleGroupItem key={key} value={key}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Bracket
        key={feel}
        stage={big}
        compactBelow={0}
        mode="pan-zoom"
        connectorRadius={8}
        zoom={feels[feel].zoom}
      />
    </div>
  );
}
