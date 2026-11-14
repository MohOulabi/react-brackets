import { useCallback, useRef } from 'react';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

/**
 * The value from an earlier render while every own property is the same, so an
 * object rebuilt on each render, like an inline `classNames`, keeps its identity.
 */
export function useStable<T extends object | null>(value: T): T {
  const last = useRef(value);
  if (!shallowEqual(last.current, value)) last.current = value;
  return last.current;
}

/** A function that never changes identity and always calls the latest `callback`. */
export function useEvent<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result {
  const latest = useRef(callback);
  useIsomorphicLayoutEffect(() => {
    latest.current = callback;
  });
  return useCallback((...args: Args) => latest.current(...args), []);
}

function shallowEqual(a: object | null, b: object | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(
    (key) => Object.hasOwn(b, key) && Object.is(a[key as keyof object], b[key as keyof object]),
  );
}
