import { Glob } from 'bun';

const [directory = 'dist'] = process.argv.slice(2);
const offenders: string[] = [];

for await (const file of new Glob('**/*.{js,cjs}').scan(directory)) {
  const source = await Bun.file(`${directory}/${file}`).text();
  if (source.includes('jsxDEV')) offenders.push(file);
}

if (offenders.length > 0) {
  console.error(
    `Development JSX found in ${offenders.join(', ')}. Build with NODE_ENV=production.`,
  );
  process.exit(1);
}
