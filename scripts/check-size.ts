// Bundles what an app gets from `react-brackets` (React itself excluded), minifies and gzips it, and fails over
// the budget. The docs quote this number, so it has to stay true.
import { gzipSync } from 'node:zlib';

const BUDGET = 14 * 1024;

const result = await Bun.build({
  entrypoints: [`${import.meta.dir}/../packages/react/dist/index.js`],
  minify: true,
  target: 'browser',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
if (!result.success) {
  console.error(result.logs.join('\n'));
  process.exit(1);
}

const code = await result.outputs[0]?.arrayBuffer();
if (!code) throw new Error('nothing was bundled');
const minified = code.byteLength;
const gzipped = gzipSync(new Uint8Array(code), { level: 9 }).byteLength;
const kB = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`;

console.log(
  `react-brackets: ${kB(minified)} minified, ${kB(gzipped)} gzipped (budget ${kB(BUDGET)})`,
);
if (gzipped > BUDGET) {
  console.error(
    'Over the size budget. Update the docs if the growth is worth it, and raise BUDGET.',
  );
  process.exit(1);
}
