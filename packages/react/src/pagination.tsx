import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx, flag, useBracketContext } from './context';
import { Icon } from './icons';

/** Props of `Bracket.Pagination`: any prop of a `nav`, except children. */
export interface PaginationProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children'> {}

/** Round navigation for the paged view. Renders nothing while the full tree is shown. */
export function Pagination({ className, ...props }: PaginationProps): ReactNode {
  const { view, rounds, page, setPage, labels, classNames } = useBracketContext();
  if (view !== 'paged') return null;

  const button = (part: 'page' | 'page-previous' | 'page-next') => ({
    type: 'button' as const,
    'data-scope': 'bracket',
    'data-part': part,
    className: classNames[part],
  });

  return (
    <nav
      {...props}
      data-scope="bracket"
      data-part="pagination"
      aria-label={labels.rounds}
      className={cx(classNames.pagination, className)}
    >
      <button
        {...button('page-previous')}
        aria-label={labels.previous}
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
      >
        <Icon name="previous" />
      </button>
      {rounds.map((round, index) => (
        <button
          {...button('page')}
          key={round.id}
          aria-current={index === page ? 'step' : undefined}
          data-active={flag(index === page)}
          onClick={() => setPage(index)}
        >
          {round.name}
        </button>
      ))}
      <button
        {...button('page-next')}
        aria-label={labels.next}
        disabled={page === rounds.length - 1}
        onClick={() => setPage(page + 1)}
      >
        <Icon name="next" />
      </button>
    </nav>
  );
}
