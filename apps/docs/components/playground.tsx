'use client';

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Monitor, Smartphone } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import {
  Bracket,
  type BracketLayout,
  type Compact,
  doubleElimination,
  roundRobin,
  type Stage,
  singleElimination,
  swiss,
  type ViewportMode,
} from 'react-brackets';
import { play, teams } from '@/components/demos/data';
import { Phone } from '@/components/demos/preview';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Format = 'single' | 'double' | 'round-robin' | 'swiss';

const formats: Record<Format, { label: string; fn: string; build: (count: number) => Stage }> = {
  single: {
    label: 'Single elimination',
    fn: 'singleElimination',
    build: (n) => singleElimination(teams(n)),
  },
  double: {
    label: 'Double elimination',
    fn: 'doubleElimination',
    build: (n) => doubleElimination(teams(n)),
  },
  'round-robin': {
    label: 'Round robin',
    fn: 'roundRobin',
    build: (n) => roundRobin(teams(Math.min(n, 8))),
  },
  swiss: { label: 'Swiss', fn: 'swiss', build: (n) => swiss(teams(n)) },
};

const accents = ['#2563eb', '#ea580c', '#059669', '#7c3aed', '#db2777'];

export function Playground() {
  const [format, setFormat] = useState<Format>('single');
  const [count, setCount] = useState(8);
  const [played, setPlayed] = useState(40);
  const [screen, setScreen] = useState<'desktop' | 'phone'>('desktop');
  const [mode, setMode] = useState<ViewportMode>('scroll');
  const [compact, setCompact] = useState<Compact>('bracket');
  const [layout, setLayout] = useState<BracketLayout>('standard');
  const [radius, setRadius] = useState(8);
  const [hideByes, setHideByes] = useState(false);
  const [accent, setAccent] = useState(accents[0] ?? '#2563eb');

  const stage = useMemo(
    () => play(formats[format].build(count), played / 100),
    [format, count, played],
  );
  const mirrored = format === 'single' && layout === 'mirrored';

  const props = [
    'stage={stage}',
    mirrored && 'layout="mirrored"',
    mode !== 'scroll' && `mode="${mode}"`,
    compact !== 'bracket' && `compact="${compact}"`,
    radius > 0 && `connectorRadius={${radius}}`,
    hideByes && 'hideByes',
  ].filter(Boolean);

  const code = `import { Bracket, ${formats[format].fn} } from 'react-brackets';
import '@react-brackets/theme/theme.css';

const stage = ${formats[format].fn}(teams);

export function Tournament() {
  return (
    <Bracket
      ${props.join('\n      ')}
    />
  );
}`;

  const bracket = (
    <Bracket
      key={`${format}-${screen}`}
      stage={stage}
      layout={mirrored ? 'mirrored' : 'standard'}
      mode={mode}
      compact={compact}
      hideByes={hideByes}
      connectorRadius={radius}
      style={{ ['--rb-accent' as string]: accent }}
    />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 text-sm">
        <Control label="Format">
          <Select value={format} onValueChange={(value) => setFormat(value as Format)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(formats).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Control>
        <Control label={`Teams · ${count}`}>
          <Slider
            min={3}
            max={32}
            value={[count]}
            onValueChange={([value]) => setCount(value ?? 8)}
          />
        </Control>
        <Control label={`Matches played · ${played}%`}>
          <Slider step={5} value={[played]} onValueChange={([value]) => setPlayed(value ?? 0)} />
        </Control>
        <Control label="Screen">
          <Toggle
            value={screen}
            onChange={setScreen}
            options={[
              ['desktop', <Monitor key="d" />],
              ['phone', <Smartphone key="p" />],
            ]}
          />
        </Control>
        <Control label="Wide screens">
          <Toggle
            value={mode}
            onChange={setMode}
            options={[
              ['scroll', 'Scroll'],
              ['fit', 'Fit'],
              ['pan-zoom', 'Zoom'],
            ]}
          />
        </Control>
        <Control label="Narrow screens">
          <Toggle
            value={compact}
            onChange={setCompact}
            options={[
              ['bracket', 'Bracket'],
              ['list', 'List'],
            ]}
          />
        </Control>
        <Control label="Layout">
          <Toggle
            value={layout}
            onChange={setLayout}
            disabled={format !== 'single'}
            options={[
              ['standard', 'Standard'],
              ['mirrored', 'Two-sided'],
            ]}
          />
        </Control>
        <Control label={`Line corners · ${radius}px`}>
          <Slider max={16} value={[radius]} onValueChange={([value]) => setRadius(value ?? 0)} />
        </Control>
        <div className="flex items-center justify-between">
          <Label htmlFor="hide-byes">Hide byes</Label>
          <Switch id="hide-byes" checked={hideByes} onCheckedChange={setHideByes} />
        </div>
        <Control label="Accent">
          <div className="flex gap-2">
            {accents.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Accent ${color}`}
                aria-pressed={color === accent}
                onClick={() => setAccent(color)}
                className="size-7 rounded-full ring-offset-2 ring-offset-card aria-pressed:ring-2 aria-pressed:ring-foreground"
                style={{ background: color }}
              />
            ))}
          </div>
        </Control>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-h-[28rem] items-center justify-center overflow-hidden rounded-xl border bg-fd-background p-4 sm:p-6">
          <div className="w-full min-w-0">
            {screen === 'phone' ? <Phone>{bracket}</Phone> : bracket}
          </div>
        </div>
        <DynamicCodeBlock lang="tsx" code={code} />
      </div>
    </div>
  );
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: [T, ReactNode][];
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      className="w-full"
      disabled={disabled}
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
    >
      {options.map(([option, label]) => (
        <ToggleGroupItem key={option} value={option} aria-label={option} className="flex-1">
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
