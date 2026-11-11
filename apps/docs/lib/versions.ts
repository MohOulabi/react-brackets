import native from '../../../packages/native/package.json';
import react from '../../../packages/react/package.json';

export interface Major {
  label: string;
  description: string;
  /** Where its docs live: here for the latest, an archived deployment or the repository for older ones. */
  url: string;
}

export interface Release {
  /** `null` until the package's first release. */
  version: string | null;
  /**
   * Newest first. To archive a version's docs when the next one ships: branch `archive/<name>` from the last
   * commit of that version and push it (Vercel builds `main` and `archive/*` only), give the branch its own
   * subdomain in the Vercel project's domains, and add it here with that address.
   */
  majors: Major[];
}

export const releases: Record<'react' | 'native', Release> = {
  react: {
    version: react.version,
    majors: [
      { label: `v${react.version.split('.')[0]}`, description: 'Latest', url: '/docs' },
      {
        label: 'v0.4',
        description: 'Before the rewrite',
        url: 'https://github.com/MohOulabi/react-brackets/tree/legacy#readme',
      },
    ],
  },
  native: {
    version: native.version === '0.0.0' ? null : native.version,
    // Before 1.0, each minor version is its own line, so 0.1 keeps its docs as they were when 0.2 arrived.
    majors: [
      { label: 'v0.2', description: 'Latest', url: '/docs/native' },
      {
        label: 'v0.1',
        description: 'Before the headless parts',
        url: 'https://native-0-1.react-brackets.oulabi.dev/docs/native',
      },
    ],
  },
};
