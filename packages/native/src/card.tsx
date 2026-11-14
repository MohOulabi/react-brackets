import type { Match } from '@react-brackets/core';
import { memo, type NamedExoticComponent, type ReactNode } from 'react';

interface CardProps {
  match: Match;
  draw: (match: Match) => ReactNode;
}

/**
 * One card. Skipped on a render that changes neither its match nor how cards are drawn, so a new
 * result redraws only the cards whose match changed, as long as `renderMatch` keeps its identity.
 */
export const Card: NamedExoticComponent<CardProps> = memo(function Card({
  match,
  draw,
}: CardProps): ReactNode {
  return draw(match);
});
