// Fails the build when a bundle exports names it never defines. Some Bun
// versions drop a package's own modules and leave only the export list.
const [directory = 'dist'] = process.argv.slice(2);
const entry = `${process.cwd()}/${directory}/index.js`;

try {
  const exports = await import(entry);
  const missing = Object.entries(exports).filter(([, value]) => value === undefined);
  if (missing.length > 0)
    throw new Error(`undefined exports: ${missing.map(([name]) => name).join(', ')}`);
  if (Object.keys(exports).length === 0) throw new Error('no exports at all');
} catch (error) {
  console.error(`Broken bundle at ${entry}: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
