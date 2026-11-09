'use client';

import { useEffect, useState } from 'react';
import {
  allMatches,
  Bracket,
  type ClassNames,
  reportResult,
  type Stage,
  singleElimination,
} from 'react-brackets';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { teams } from './data';
import { Phone } from './preview';

const target = 3;

/** One scoring event per tick: a live match gains a point, or the next one kicks off. */
export function tick(stage: Stage, size = 8): Stage {
  const live = allMatches(stage).find((match) => match.status === 'live');
  if (!live) {
    const next = allMatches(stage).find((match) => match.status === 'ready');
    return next
      ? reportResult(stage, next.id, { scores: [0, 0], live: true })
      : singleElimination(teams(size));
  }
  const side = Math.random() < 0.5 ? 0 : 1;
  const scores: [number, number] = [live.slots[0].score ?? 0, live.slots[1].score ?? 0];
  scores[side] += 1;
  return reportResult(stage, live.id, { scores, live: scores[side] < target });
}

export function useLiveStage(size = 8, every = 900): Stage {
  const [stage, setStage] = useState(() => singleElimination(teams(size)));
  useEffect(() => {
    const timer = setInterval(() => setStage((current) => tick(current, size)), every);
    return () => clearInterval(timer);
  }, [size, every]);
  return stage;
}

const easings = {
  'Standard (default)': 'cubic-bezier(0.2, 0, 0, 1)',
  'Ease out': 'ease-out',
  Spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  Linear: 'linear',
};

export function MotionDemo() {
  const [enabled, setEnabled] = useState(true);
  const [duration, setDuration] = useState(320);
  const [easing, setEasing] = useState<keyof typeof easings>('Standard (default)');
  const stage = singleElimination(teams(8));
  const motion = enabled ? { duration, easing: easings[easing] } : false;

  return (
    <div className="grid items-start gap-8 md:grid-cols-[minmax(0,16rem)_1fr]">
      <div className="flex flex-col gap-5 text-sm">
        <div className="flex items-center justify-between">
          <Label htmlFor="motion-on">Animate</Label>
          <Switch id="motion-on" checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Duration · {duration}ms</Label>
          <Slider
            disabled={!enabled}
            min={100}
            max={1200}
            step={20}
            value={[duration]}
            onValueChange={([value]) => setDuration(value ?? 320)}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Easing</Label>
          <Select
            disabled={!enabled}
            value={easing}
            onValueChange={(value) => setEasing(value as keyof typeof easings)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(easings).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground">Swipe the bracket, or use the round tabs.</p>
      </div>
      <Phone>
        <Bracket stage={stage} motion={motion} connectorRadius={8} />
      </Phone>
    </div>
  );
}

const flashy: ClassNames = {
  match: 'data-updated:animate-[pop_600ms_ease-out]',
  participant: 'data-entered:animate-[slide-in_500ms_ease-out]',
};

export function PerItemDemo() {
  const stage = useLiveStage(8, 700);
  return (
    <>
      <style>{`
        @keyframes pop { 40% { transform: scale(1.04); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-8px); } }
      `}</style>
      <Bracket stage={stage} classNames={flashy} connectorRadius={8} />
    </>
  );
}

export function LiveDemo() {
  return <Bracket stage={useLiveStage()} connectorRadius={8} />;
}
