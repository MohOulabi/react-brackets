/**
 * Fails when a published package depends on something npm can't install.
 *
 * `changeset publish` runs `npm publish`, which ships `workspace:*`, `file:` and `link:` ranges as they are,
 * unlike Bun and pnpm, which rewrite them. Every npm user then gets EUNSUPPORTEDPROTOCOL. Internal
 * dependencies use real ranges instead; Bun still links the local package when the range matches.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'] as const;
const LOCAL = /^(workspace|file|link|portal):/;

const root = join(import.meta.dir, '..', 'packages');
const problems: string[] = [];

for (const folder of readdirSync(root)) {
  const pkg = JSON.parse(readFileSync(join(root, folder, 'package.json'), 'utf8'));
  if (pkg.private) continue;
  for (const field of FIELDS) {
    for (const [name, range] of Object.entries<string>(pkg[field] ?? {})) {
      if (LOCAL.test(range)) problems.push(`${pkg.name}: ${field}.${name} is "${range}"`);
    }
  }
}

if (problems.length > 0) {
  console.error(
    'These ranges only resolve inside the monorepo, so npm users could not install the package:',
  );
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('Use a real range, like "^2.0.0", instead.');
  process.exit(1);
}
console.log('Every published dependency has a range npm can install.');
