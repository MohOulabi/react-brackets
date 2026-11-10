import type { Metadata } from 'next';
import { Gallery } from '@/components/examples/gallery';
import { NativeSource } from '@/components/examples/source';
import { Recording } from '@/components/native/recording';
import { repository } from '@/lib/layout.shared';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'React Native examples',
  description:
    'Screens from the Expo example app built with @react-brackets/native, recorded on an iPhone: every format, live scores, an esports bracket, custom cards, theming and right to left, each with its code.',
  alternates: { canonical: '/examples/native' },
};

interface Example {
  /** The file or folder under `examples/native/src/examples`, also the anchor on this page. */
  slug: string;
  title: string;
  summary: string;
}

const groups: { title: string; examples: Example[] }[] = [
  {
    title: 'Showcases',
    examples: [
      {
        slug: 'esports',
        title: 'Esports',
        summary:
          "Best-of-three series in the teams' colours. Open a team for its roster and the bracket makes room, play a series map by map, or play the whole bracket and crown a champion.",
      },
      {
        slug: 'nations',
        title: 'Nations',
        summary:
          'Your own cards with flags, seeds, kick-off times and a live match that breathes on the UI thread. Tap a match to see when it kicks off.',
      },
    ],
  },
  {
    title: 'Start',
    examples: [
      {
        slug: 'quick-start',
        title: 'Quick start',
        summary:
          'A stage from a list of teams, passed to one component. On a phone it pages through one round at a time.',
      },
      {
        slug: 'follow-a-team',
        title: 'Follow a team',
        summary:
          'Tap a team, or pick one from the chips, to light up its path. Both stay in step through highlighted and onHighlightChange.',
      },
    ],
  },
  {
    title: 'Formats',
    examples: [
      {
        slug: 'double-elimination',
        title: 'Double elimination',
        summary:
          'The winners bracket with its grand final, and the losers bracket below it, each paged on its own.',
      },
      {
        slug: 'two-sided',
        title: 'Two-sided bracket',
        summary:
          'Two halves that meet in the final, kept whole on a phone and scrolled sideways at full size.',
      },
      {
        slug: 'swiss',
        title: 'Swiss',
        summary:
          'Each round is paired from the standings so far. Pair a round, play it, and watch the table move.',
      },
      {
        slug: 'groups-to-playoffs',
        title: 'Groups to playoffs',
        summary:
          "Two round robin groups with their tables, every group's match days, and a knockout with a third-place match.",
      },
    ],
  },
  {
    title: 'Styling',
    examples: [
      {
        slug: 'unistyles',
        title: 'Theme and dark mode',
        summary:
          'The bracket follows your Unistyles themes, so it turns light or dark with the rest of your app.',
      },
      {
        slug: 'tailwind',
        title: 'Tailwind',
        summary: 'Cards styled with classes through Uniwind, keyed off their state.',
      },
      {
        slug: 'round-titles',
        title: 'Round titles',
        summary: "Each round's date and how many of its matches are played, above the round.",
      },
      {
        slug: 'connector-lines',
        title: 'Connector lines',
        summary:
          "Rounded, square or bold: the lines' colour, width and corners, and the colour of a highlighted path.",
      },
      {
        slug: 'right-to-left',
        title: 'Right to left',
        summary:
          'An Arabic cup that starts on the right and swipes the other way. Round names and labels are yours to translate.',
      },
    ],
  },
  {
    title: 'Screens and data',
    examples: [
      {
        slug: 'fixtures-list',
        title: 'Fixtures list',
        summary:
          'Each round as a plain list of matches, for long draws where the fixtures matter more than the lines.',
      },
      {
        slug: 'full-tree',
        title: 'Full bracket on a phone',
        summary: 'Keep the whole tree on a phone: pinch, drag, or double tap to zoom.',
      },
      {
        slug: 'live-scores',
        title: 'Live scores',
        summary:
          'Results stream in and winners move on as they land, and the view follows the round being played.',
      },
      {
        slug: 'loading',
        title: 'Loading',
        summary:
          "A placeholder at the bracket's real size while the draw loads, then the bracket in its place.",
      },
    ],
  },
];

const count = groups.reduce((total, group) => total + group.examples.length, 0);

export default function NativeExamplesPage() {
  return (
    <Gallery
      platform="native"
      repository={repository}
      intro={
        <>
          {count} screens from the Expo app in the repository, recorded on an iPhone, with all of
          their code. To run them, clone the repository and run{' '}
          <code className="text-foreground">bun run ios</code> in{' '}
          <code className="text-foreground">examples/native</code>.
        </>
      }
      groups={groups.map((group) => ({
        title: group.title,
        examples: group.examples.map(({ slug, title, summary }) => ({
          id: slug,
          title,
          summary,
          path: `examples/native/src/examples/${slug}`,
          preview: <Recording slug={slug} label={`${title}, recorded on an iPhone`} />,
          code: <NativeSource slug={slug} />,
        })),
      }))}
    />
  );
}
