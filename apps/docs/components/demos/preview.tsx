import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A framed, padded stage for a live example in the docs. */
export function Preview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'not-prose my-6 overflow-hidden rounded-xl border bg-fd-background p-4 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A phone-sized frame, so narrow-screen behaviour shows on a desktop. */
export function Phone({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <figure className="m-0 flex w-full min-w-0 flex-col items-center gap-3">
      <div className="w-[min(100%,360px)] min-w-0 rounded-[2rem] border-[6px] border-foreground/10 bg-background px-3 py-5 shadow-sm">
        {children}
      </div>
      {label && <figcaption className="text-sm text-muted-foreground">{label}</figcaption>}
    </figure>
  );
}
