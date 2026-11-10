import type { ComponentType } from 'react';
import ConnectorLines from './examples/connector-lines';
import DoubleElimination from './examples/double-elimination';
import Esports from './examples/esports';
import FixturesList from './examples/fixtures-list';
import FollowATeam from './examples/follow-a-team';
import FullTree from './examples/full-tree';
import GroupsToPlayoffs from './examples/groups-to-playoffs';
import LiveScores from './examples/live-scores';
import Loading from './examples/loading';
import Nations from './examples/nations';
import QuickStart from './examples/quick-start';
import RightToLeft from './examples/right-to-left';
import RoundTitles from './examples/round-titles';
import Swiss from './examples/swiss';
import Tailwind from './examples/tailwind';
import TwoSided from './examples/two-sided';
import Unistyles from './examples/unistyles';

export interface Example {
  slug: string;
  title: string;
  summary: string;
  Screen: ComponentType;
}

export const examples: Example[] = [
  {
    slug: 'quick-start',
    title: 'Quick start',
    summary: 'One component, swiped a round at a time.',
    Screen: QuickStart,
  },
  {
    slug: 'live-scores',
    title: 'Live scores',
    summary: 'Results stream in and the view follows the match.',
    Screen: LiveScores,
  },
  {
    slug: 'esports',
    title: 'Esports',
    summary: 'Best-of-three series you can play, one map at a time.',
    Screen: Esports,
  },
  {
    slug: 'follow-a-team',
    title: 'Follow a team',
    summary: 'Light up a path from a picker or a tap.',
    Screen: FollowATeam,
  },
  {
    slug: 'nations',
    title: 'Nations',
    summary: 'Your own cards, with flags, seeds and a live match.',
    Screen: Nations,
  },
  {
    slug: 'round-titles',
    title: 'Round titles',
    summary: 'Dates and progress above every round.',
    Screen: RoundTitles,
  },
  {
    slug: 'connector-lines',
    title: 'Connector lines',
    summary: 'Colour, width and corners of the lines.',
    Screen: ConnectorLines,
  },
  {
    slug: 'fixtures-list',
    title: 'Fixtures list',
    summary: 'Each round as a plain list.',
    Screen: FixturesList,
  },
  {
    slug: 'full-tree',
    title: 'Full tree',
    summary: 'The whole bracket, to pinch, drag and zoom.',
    Screen: FullTree,
  },
  {
    slug: 'two-sided',
    title: 'Two-sided',
    summary: 'Both halves meeting at the final.',
    Screen: TwoSided,
  },
  {
    slug: 'double-elimination',
    title: 'Double elimination',
    summary: 'Winners, losers and a grand final.',
    Screen: DoubleElimination,
  },
  {
    slug: 'swiss',
    title: 'Swiss',
    summary: 'Pair, play and rank round by round.',
    Screen: Swiss,
  },
  {
    slug: 'groups-to-playoffs',
    title: 'Groups to playoffs',
    summary: 'League tables feeding a knockout.',
    Screen: GroupsToPlayoffs,
  },
  {
    slug: 'right-to-left',
    title: 'Right to left',
    summary: 'An Arabic cup that reads and swipes from the right.',
    Screen: RightToLeft,
  },
  {
    slug: 'loading',
    title: 'Loading',
    summary: 'A placeholder bracket while the draw loads.',
    Screen: Loading,
  },
  {
    slug: 'tailwind',
    title: 'Tailwind',
    summary: 'Cards styled with classes, through Uniwind.',
    Screen: Tailwind,
  },
  {
    slug: 'unistyles',
    title: 'Unistyles',
    summary: 'A bracket that follows your Unistyles theme.',
    Screen: Unistyles,
  },
];
