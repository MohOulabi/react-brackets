'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface NavGroup {
  title: string;
  links: { id: string; title: string }[];
}

/** The examples index, marking the example being read. */
export function ExamplesNav({ groups }: { groups: NavGroup[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = groups.flatMap((group) => group.links.map((link) => link.id));
    const visible = new Set<string>();
    // An example counts as read while it crosses a band a little above the middle of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [groups]);

  return (
    <nav aria-label="Examples" className="hidden lg:block">
      <div className="sticky top-24 flex flex-col gap-6 text-sm">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <p className="mb-1 font-semibold">{group.title}</p>
            {group.links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={link.id === active ? 'location' : undefined}
                className={cn(
                  'relative rounded-md py-1 ps-3 text-muted-foreground transition-colors hover:text-foreground',
                  'before:absolute before:inset-y-1.5 before:start-0 before:w-0.5 before:rounded-full before:bg-border before:transition-colors',
                  'aria-[current]:font-medium aria-[current]:text-foreground aria-[current]:before:bg-brand',
                )}
              >
                {link.title}
              </a>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
