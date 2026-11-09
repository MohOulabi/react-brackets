import type { ReactNode } from 'react';

const paths = {
  previous: 'M10 3.5 5.5 8l4.5 4.5',
  next: 'm6 3.5 4.5 4.5L6 12.5',
  minus: 'M3.5 8h9',
  plus: 'M8 3.5v9M3.5 8h9',
  fit: 'M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3',
};

/** A 16px stroke icon that inherits the text colour. Flips with the text direction where it points. */
export function Icon({ name }: { name: keyof typeof paths }): ReactNode {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      <path d={paths[name]} />
    </svg>
  );
}
