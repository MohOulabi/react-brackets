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
   * Newest first. When a new major ships, deploy the docs from the last commit of the one before it
   * as their own site (a `v2` subdomain, say) and add it here with that address.
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
    majors: [],
  },
};
