# react-brackets

Headless, responsive tournament brackets for React.

**[Documentation and live examples](https://react-brackets.oulabi.dev)**

- **Headless.** Semantic markup with `data-*` hooks and no styles. Bring Tailwind, CSS modules, or the optional theme.
- **A bracket on every screen.** On phones, swipe through the bracket one round at a time while it still looks like a bracket. Or keep the full tree with scroll, fit, or pan and zoom.
- **Accurate lines.** Connectors are measured from your real match cards, so any card size, mirrored layout or right-to-left page just works.
- **Every format.** Single and double elimination, two-sided brackets, round robin, Swiss and groups to playoffs, with seeding, byes, results and standings.
- **Small.** No runtime dependencies besides React.

> **v2 is a ground-up rewrite.** Upgrading from 0.x? Read the [migration guide](MIGRATION.md). v0.x lives on the [`legacy`](https://github.com/MohOulabi/react-brackets/tree/legacy) branch.

## Install

```bash
npm install react-brackets @react-brackets/theme
```

## Quick start

```tsx
import { Bracket, singleElimination } from 'react-brackets';
import '@react-brackets/theme/theme.css';

const stage = singleElimination([
  { id: 'falcons', name: 'Falcons' },
  { id: 'wolves', name: 'Wolves' },
  { id: 'herons', name: 'Herons' },
  { id: 'lynx', name: 'Lynx' },
]);

export function App() {
  return <Bracket stage={stage} />;
}
```

## Results

Stages are plain data. Report a result and get a new stage back, with the winner moved forward:

```ts
import { reportResult } from 'react-brackets';

const next = reportResult(stage, 'main.r1.m1', { scores: [3, 1] });
const live = reportResult(next, 'main.r1.m2', { scores: [1, 1], live: true });
```

Overturning a result clears everything that depended on it.

## Formats

```ts
import {
  doubleElimination,
  nextSwissRound,
  qualifiers,
  roundRobin,
  singleElimination,
  standings,
  swiss,
} from 'react-brackets';

singleElimination(teams, { thirdPlace: true });
doubleElimination(teams, { grandFinal: 'reset' });
roundRobin(teams, { groups: 2, legs: 2 });
swiss(players, { rounds: 5 }); // then nextSwissRound(stage) after each round

standings(stage); // points, wins, draws, losses, score difference
singleElimination(qualifiers(groupStage, 2)); // A1 v B2, B1 v A2
```

Pass `layout="mirrored"` to `<Bracket>` for a two-sided bracket that meets in the middle.

## Small screens

Below `compactBelow` (640px of **container** width by default) the bracket pages through one round at a time. The round in focus stacks tightly, the next one peeks in with its connectors, and swiping glides every match into place.

```tsx
<Bracket stage={stage} />                    // swipeable bracket (default)
<Bracket stage={stage} compact="list" />     // swipeable lists of matches
<Bracket stage={stage} compactBelow={0} mode="fit" />       // the whole tree, scaled to fit
<Bracket stage={stage} compactBelow={0} mode="pan-zoom" />  // drag, pinch and zoom
```

## Styling

Every element has `data-scope="bracket"` and a `data-part`, plus state attributes such as `data-winner`, `data-loser`, `data-bye`, `data-status` and `data-highlighted`.

Pass classes per part:

```tsx
<Bracket
  stage={stage}
  classNames={{
    match: 'rounded-xl bg-white ring-1 ring-zinc-200 data-highlighted:ring-indigo-500',
    participant: 'flex justify-between px-3 py-2 data-winner:font-semibold',
    connector: 'stroke-zinc-300 data-highlighted:stroke-indigo-500',
  }}
/>;
```

Or use the theme and override its variables:

```css
.my-bracket {
  --rb-accent: #c2410c;
  --rb-radius: 14px;
  --rb-match-width: 12rem;
}
```

The theme follows the page's `color-scheme`, so light and dark work without extra setup.

## Composition

`<Bracket>` is a shortcut. Compose the parts yourself for full control:

```tsx
<Bracket.Root stage={stage} layout="mirrored" onMatchClick={openMatch}>
  <Bracket.Viewport>
    <Bracket.Rounds>
      {() => (
        <Bracket.Round>
          <Bracket.RoundTitle />
          <Bracket.Matches>
            {(match) => (
              <Bracket.Match>
                <Bracket.Participant slot={0} />
                <Bracket.Participant slot={1} />
              </Bracket.Match>
            )}
          </Bracket.Matches>
        </Bracket.Round>
      )}
    </Bracket.Rounds>
    <Bracket.Connectors radius={8} />
  </Bracket.Viewport>
  <Bracket.Pagination />
</Bracket.Root>;
```

## Server components

`react-brackets` is a client module. In a React Server Component, build the stage with `@react-brackets/core` and pass it down:

```tsx
import { singleElimination } from '@react-brackets/core';
import { Bracket } from 'react-brackets';

export default function Page() {
  return <Bracket stage={singleElimination(teams)} />;
}
```

## Packages

| Package                                   | Description                                                 |
| ----------------------------------------- | ----------------------------------------------------------- |
| [`react-brackets`](packages/react)        | Headless React components. Re-exports the core.             |
| [`@react-brackets/core`](packages/core)   | Formats, results and layout. No framework, no dependencies. |
| [`@react-brackets/theme`](packages/theme) | Optional stylesheet driven by CSS variables.                |

## Examples

Run them all locally with `bun install && bun run build && bun run examples`. The source is in [`examples`](examples):

- [basic](examples/basic)
- [theme and dark mode](examples/theme)
- [custom match card](examples/custom-match)
- [Tailwind CSS](examples/tailwind)
- [right to left](examples/rtl)
- [double elimination](examples/double-elimination)
- [two-sided](examples/two-sided)
- [round robin](examples/round-robin)
- [Swiss](examples/swiss)
- [groups to playoffs](examples/groups-to-playoffs)
- [full bracket on every screen](examples/full-bracket)
- [live scores](examples/live-scores)
- [Next.js App Router](examples/nextjs)

## Contributing

The repo uses [Bun](https://bun.sh) workspaces and [Biome](https://biomejs.dev).

```bash
bun install
bun run build
bun run test
bun run lint
```

## Thanks

To everyone who used, reported and improved v0.x, and especially to [Oliver Looney](https://github.com/Oliver-Looney) for keeping it alive.

## License

[MIT](LICENSE)
