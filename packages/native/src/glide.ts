import { useLayoutEffect, useRef } from 'react';
import { Easing, type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Glides from one set of places to the next instead of jumping, as when a card
 * opens and the cards around it make room. When `key` changes, the offsets are set
 * to what `sample` read from the old key less what it reads from the new one, and
 * run down to zero; add them to what is drawn. A glide still running carries on
 * from where it is.
 */
export function useGlide<K>(
  key: K,
  sample: (key: K) => number[],
  duration: number | null,
): SharedValue<number[]> {
  const shown = useRef(key);
  const offsets = useSharedValue<number[]>([]);

  useLayoutEffect(() => {
    const previous = shown.current;
    shown.current = key;
    if (previous === key || duration === null) return;
    const before = sample(previous);
    const after = sample(key);
    const running = offsets.value;
    const start = after.map(
      (value, index) => (before[index] ?? value) - value + (running[index] ?? 0),
    );
    if (start.every((value) => Math.abs(value) < 0.5)) {
      offsets.value = start.map(() => 0);
      return;
    }
    offsets.value = start;
    offsets.value = withTiming(
      start.map(() => 0),
      { duration, easing: Easing.bezier(0.2, 0, 0, 1) },
    );
  }, [key, sample, duration, offsets]);

  return offsets;
}
