/** Pages that cover the same thing on the web and on React Native, web first. */
const pairs: [web: string, native: string][] = [
  ['/docs', '/docs/native'],
  ['/docs/installation', '/docs/native/installation'],
  ['/docs/guides/results', '/docs/native/results'],
  ['/docs/guides/loading', '/docs/native/loading'],
  ['/docs/guides/click-events', '/docs/native/press-and-highlight'],
  ['/docs/guides/small-screens', '/docs/native/layouts'],
  ['/docs/guides/rtl-and-languages', '/docs/native/right-to-left'],
  ['/docs/styling/theme', '/docs/native/theme'],
  ['/docs/styling/tailwind', '/docs/native/styling'],
  ['/docs/customize/match-cards', '/docs/native/match-cards'],
  ['/docs/customize/titles-and-navigation', '/docs/native/round-titles'],
  ['/docs/customize/navigation-and-zoom', '/docs/native/navigation-and-zoom'],
  ['/docs/customize/building-from-parts', '/docs/native/building-from-parts'],
  ['/docs/api/parts', '/docs/native/api'],
  ['/docs/api/bracket', '/docs/native/api'],
  ['/docs/api/hooks-and-types', '/docs/native/hooks-and-types'],
];

/** The same topic on the other platform, to show as a link at the top of the page. */
export function counterpart(
  url: string,
): { url: string; platform: 'React' | 'React Native' } | null {
  for (const [web, native] of pairs) {
    if (url === web) return { url: native, platform: 'React Native' };
    if (url === native) return { url: web, platform: 'React' };
  }
  return null;
}
