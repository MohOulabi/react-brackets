'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

/** Mounts its children once they scroll into view, so an example that plays over time starts where it is seen. */
export function OnScreen({ children, minHeight }: { children: ReactNode; minHeight: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || seen) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setSeen(true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [seen]);

  return (
    <div ref={ref} style={seen ? undefined : { minHeight }}>
      {seen && children}
    </div>
  );
}
