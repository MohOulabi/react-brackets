import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  Basic,
  CustomMatch,
  DoubleElimination,
  Esports,
  FullBracket,
  GroupsToPlayoffs,
  LiveScores,
  Loading,
  MatchCentre,
  RoundRobin,
  Rtl,
  Swiss,
  Tailwind,
  Theme,
  TwoSided,
} from '@/components/examples/apps';
import { Gallery } from '@/components/examples/gallery';
import { OnScreen } from '@/components/examples/on-screen';
import { Source } from '@/components/examples/source';
import { repository } from '@/lib/layout.shared';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Examples',
  description:
    'Small React apps built with react-brackets: every format, the theme, Tailwind, custom match cards, right to left, live scores and loading states, each with its code.',
  alternates: { canonical: '/examples' },
};

interface Example {
  /** The folder under `examples/`, also the anchor on this page. */
  folder: string;
  title: string;
  summary: string;
  demo?: ReactNode;
}

const groups: { title: string; examples: Example[] }[] = [
  {
    title: 'Showcases',
    examples: [
      {
        folder: 'match-centre',
        title: 'Match centre',
        summary:
          'Flags, seeds and a live minute. Cards open into stats and scorers, a right-click menu follows a team or sets a reminder, and Replay brings the results back in one by one. Built with Tailwind and shadcn/ui.',
        demo: <MatchCentre />,
      },
      {
        folder: 'esports',
        title: 'Esports',
        summary:
          "A dark arena in the teams' colours. Open a team for its roster with roles and KDA, play a series map by map, or play the whole bracket and crown a champion. Plain CSS modules and lucide icons.",
        demo: <Esports />,
      },
    ],
  },
  {
    title: 'Start',
    examples: [
      {
        folder: 'basic',
        title: 'Basic',
        summary: 'A stage from a list of teams, passed to one component. The whole quick start.',
        demo: <Basic />,
      },
      {
        folder: 'nextjs',
        title: 'Next.js',
        summary:
          'A server component builds the stage with @react-brackets/core, and the bracket hydrates on the client.',
      },
    ],
  },
  {
    title: 'Formats',
    examples: [
      {
        folder: 'double-elimination',
        title: 'Double elimination',
        summary:
          'Winners and losers brackets and a grand final that can reset, in tabs built from Bracket.Root and its parts.',
        demo: <DoubleElimination />,
      },
      {
        folder: 'two-sided',
        title: 'Two-sided bracket',
        summary:
          'Sixteen teams in two halves that meet in the final. Follow a team to light up its path.',
        demo: <TwoSided />,
      },
      {
        folder: 'round-robin',
        title: 'Round robin',
        summary:
          'Everyone plays everyone. Play the season a round at a time and watch the table move.',
        demo: <RoundRobin />,
      },
      {
        folder: 'swiss',
        title: 'Swiss',
        summary: 'Each round is paired from the standings so far. Pair a round, play it, repeat.',
        demo: <Swiss />,
      },
      {
        folder: 'groups-to-playoffs',
        title: 'Groups to playoffs',
        summary: 'Two groups whose top two teams seed a knockout bracket with a third-place match.',
        demo: <GroupsToPlayoffs />,
      },
    ],
  },
  {
    title: 'Styling',
    examples: [
      {
        folder: 'theme',
        title: 'Theme and dark mode',
        summary:
          'The optional stylesheet, recoloured with a few CSS variables. Pick an accent, the corners, and light or dark.',
        demo: <Theme />,
      },
      {
        folder: 'tailwind',
        title: 'Tailwind CSS',
        summary:
          'No stylesheet of ours at all: Tailwind classes on every part, keyed off its state.',
        demo: <Tailwind />,
      },
      {
        folder: 'custom-match',
        title: 'Custom match card',
        summary:
          'Your own card with kickoff times, team badges and a live marker. Pick a match to see its details.',
        demo: <CustomMatch />,
      },
      {
        folder: 'rtl',
        title: 'Right to left',
        summary:
          'The same cup in Arabic, right to left, or in English. Round names and labels are yours to translate.',
        demo: <Rtl />,
      },
    ],
  },
  {
    title: 'Screens and data',
    examples: [
      {
        folder: 'full-bracket',
        title: 'Full bracket on every screen',
        summary:
          'Keep the whole tree on a phone: scroll it, fit it to the width, or pan and pinch to zoom.',
        demo: <FullBracket />,
      },
      {
        folder: 'live-scores',
        title: 'Live scores',
        summary:
          'Results stream in and winners move on as they land. Pause, restart, or click a match to follow it.',
        demo: (
          <OnScreen minHeight="26rem">
            <LiveScores />
          </OnScreen>
        ),
      },
      {
        folder: 'loading',
        title: 'Loading',
        summary:
          "A skeleton at the bracket's real size while the draw loads, then the bracket in its place.",
        demo: (
          <OnScreen minHeight="26rem">
            <Loading />
          </OnScreen>
        ),
      },
    ],
  },
];

const count = groups.reduce((total, group) => total + group.examples.length, 0);

export default function ExamplesPage() {
  return (
    <Gallery
      platform="react"
      repository={repository}
      intro={
        <>
          {count} small apps from the repository, each running here exactly as it does on its own,
          with all of its code. To run them locally, clone the repository and run{' '}
          <code className="text-foreground">bun run examples</code>.
        </>
      }
      groups={groups.map((group) => ({
        title: group.title,
        examples: group.examples.map(({ folder, title, summary, demo }) => ({
          id: folder,
          title,
          summary,
          path: `examples/${folder}`,
          preview: demo,
          code: <Source folder={folder} />,
        })),
      }))}
    />
  );
}
