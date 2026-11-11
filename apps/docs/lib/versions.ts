import native from '../../../packages/native/package.json';
import react from '../../../packages/react/package.json';

export interface Major {
  label: string;
  description: string;
  /** Where its docs live: a path on this site, or the repository for versions from before it. */
  url: string;
}

export interface Release {
  /** `null` until the package's first release. */
  version: string | null;
  /**
   * Newest first. To keep a version's docs when the next one ships, copy its pages into a folder named after it
   * inside the platform's docs (`content/docs/native/v0.1`), with links pointing into the copy and a `meta.json`
   * marked `root`, and add it here with that path. The copy stays on this site, out of the sidebar, search,
   * sitemap and `llms.txt`, with a note on every page pointing to the latest docs.
   */
  majors: Major[];
}

/** The release line a version belongs to: its major, or its minor before 1.0, like `v2` or `v0.3`. */
function line(version: string): string {
  const [major = '0', minor = '0'] = version.split('.');
  return major === '0' ? `v0.${minor}` : `v${major}`;
}

export const releases: Record<'react' | 'native', Release> = {
  react: {
    version: react.version,
    majors: [
      { label: line(react.version), description: 'Latest', url: '/docs' },
      {
        label: 'v0.4',
        description: 'Before the rewrite',
        url: 'https://github.com/MohOulabi/react-brackets/tree/legacy#readme',
      },
    ],
  },
  native: {
    version: native.version === '0.0.0' ? null : native.version,
    // Before 1.0 a minor version can break things, so 0.1 keeps its docs as they were when 0.2 changed the API.
    // Releases that only add, like 0.3, stay on the latest docs.
    majors: [
      { label: line(native.version), description: 'Latest', url: '/docs/native' },
      {
        label: 'v0.1',
        description: 'Before the headless parts',
        url: '/docs/native/v0.1',
      },
    ],
  },
};

/** The older version a page belongs to, when it is in one of the archived copies on this site. */
export function archivedMajor(url: string): { major: Major; latest: Major } | null {
  for (const release of Object.values(releases)) {
    const [latest, ...older] = release.majors;
    const major = older.find((major) => major.url.startsWith('/') && within(url, major.url));
    if (latest && major) return { major, latest };
  }
  return null;
}

function within(url: string, base: string): boolean {
  return url === base || url.startsWith(`${base}/`);
}
