import { useEffect, useRef, useState } from 'react';

/**
 * True for `duration` milliseconds after `signature` changes, never on the first
 * render. `null` turns it off, e.g. when the user prefers reduced motion.
 */
export function useChangeFlag(signature: string, duration: number | null): boolean {
  const previous = useRef(signature);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (previous.current === signature) return;
    previous.current = signature;
    if (duration === null) return;
    setChanged(true);
    const timer = setTimeout(() => setChanged(false), duration);
    return () => clearTimeout(timer);
  }, [signature, duration]);

  return changed;
}
