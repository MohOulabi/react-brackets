'use client';

import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Release } from '@/lib/versions';

/**
 * The version these docs describe, for the platform being read, with the other
 * major versions a click away for anyone still on one of them.
 */
export function VersionMenu({ react, native }: { react: Release; native: Release }) {
  const pathname = usePathname();
  const release = pathname.startsWith('/docs/native') ? native : react;
  // The deepest on-site version this page sits in: an archived copy, or the latest docs.
  const current = release.majors
    .filter((major) => pathname === major.url || pathname.startsWith(`${major.url}/`))
    .sort((a, b) => b.url.length - a.url.length)[0];
  const latest = !current || current === release.majors[0];
  const label = !latest
    ? current.label
    : release.version
      ? `v${release.version}`
      : 'Not on npm yet';
  const row = 'flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-sm';

  if (release.majors.length < 2) {
    return (
      <p className={cn(row, 'text-fd-muted-foreground')}>
        <span>Version</span>
        <span className="ms-auto shrink-0 tabular-nums">{label}</span>
      </p>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          row,
          'text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground',
        )}
      >
        <span>Version</span>
        <span className="ms-auto shrink-0 tabular-nums">{label}</span>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-(--radix-popover-trigger-width) flex-col p-1">
        {release.majors.map((major, index) => (
          <a
            key={major.label}
            href={major.url}
            aria-current={(current ? major === current : index === 0) ? 'page' : undefined}
            className="flex flex-col rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-fd-accent aria-[current]:bg-fd-primary/10"
          >
            <span className="font-medium">{major.label}</span>
            <span className="text-fd-muted-foreground">{major.description}</span>
          </a>
        ))}
      </PopoverContent>
    </Popover>
  );
}
