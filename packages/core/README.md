# @react-brackets/core

The framework-agnostic engine behind [react-brackets](https://github.com/MohOulabi/react-brackets): tournament formats, results, standings and layout, with no dependencies.

```bash
npm install @react-brackets/core
```

```ts
import { reportResult, singleElimination, standings } from '@react-brackets/core';

let stage = singleElimination(teams, { thirdPlace: true });
stage = reportResult(stage, 'main.r1.m1', { scores: [3, 1] });
```

- Single and double elimination, round robin, Swiss, and groups to playoffs
- Seeding with automatic byes, result propagation, live scores and standings
- Plain, serialisable data: store a stage, send it, render it anywhere
- `layoutGroup` for drawing brackets outside React

If you use React, install `react-brackets` instead: it re-exports everything here.

[Documentation](https://github.com/MohOulabi/react-brackets) · MIT
