import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

const examples = path.join(process.cwd(), '../../examples');

/** Where a file comes in the tabs: the app first, its entry point last. */
const rank = (file: string) =>
  /(^|\/)(app|page)\.tsx$/.test(file) ? 0 : /main\.tsx$/.test(file) ? 2 : 1;

/** Every source file of an example, so the code can be copied as a whole. */
export async function Source({ folder }: { folder: string }) {
  const base = path.join(examples, folder);
  const dir = folder === 'nextjs' ? 'app' : 'src';
  const entries = await readdir(path.join(base, dir), { recursive: true });
  const files = entries
    .filter((file) => /\.(tsx?|css)$/.test(file))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  // shadcn/ui components are added with its CLI rather than copied from here.
  const shadcn = files.filter((file) => file.startsWith('components/ui/'));
  const shown = files.filter((file) => !shadcn.includes(file));
  const sources = await Promise.all(
    shown.map((file) => readFile(path.join(base, dir, file), 'utf8')),
  );
  const { dependencies = {} } = JSON.parse(await readFile(path.join(base, 'package.json'), 'utf8'));
  const packages = Object.keys(dependencies).filter(
    (name) => !/^(react|react-dom|next)$/.test(name),
  );
  const setup = [
    `npm install ${packages.join(' ')}`,
    shadcn.length > 0 &&
      `npx shadcn@latest add ${shadcn.map((file) => path.basename(file, '.tsx')).join(' ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="mt-4 flex flex-col gap-3">
      <ServerCodeBlock code={setup} lang="bash" codeblock={{ className: 'my-0' }} />
      <Tabs items={shown}>
        {shown.map((file, index) => (
          <Tab key={file} value={file}>
            <ServerCodeBlock
              code={sources[index] ?? ''}
              lang={file.endsWith('.css') ? 'css' : 'tsx'}
              codeblock={{ className: 'my-0' }}
            />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}

const native = path.join(examples, 'native');

/** Libraries a native example needs beyond the bracket and its peers, by the example. */
const nativeExtras: Record<string, string[]> = {
  tailwind: ['uniwind', 'tailwindcss'],
  unistyles: ['react-native-unistyles', 'react-native-nitro-modules', 'react-native-edge-to-edge'],
};

/** A native example's files: one file, or a folder whose index comes first. */
export async function NativeSource({ slug }: { slug: string }) {
  const dir = path.join(native, 'src/examples');
  const files = await readdir(path.join(dir, slug))
    .then((inFolder) =>
      inFolder
        .filter((file) => /\.tsx?$/.test(file))
        .sort((a, b) => Number(!a.startsWith('index')) - Number(!b.startsWith('index')))
        .map((file) => `${slug}/${file}`),
    )
    .catch(() => [`${slug}.tsx`]);
  const sources = await Promise.all(files.map((file) => readFile(path.join(dir, file), 'utf8')));
  const setup = [
    'npx expo install @react-brackets/native react-native-reanimated react-native-worklets react-native-gesture-handler',
    ...(nativeExtras[slug] ?? []).map((name) => `npx expo install ${name}`),
  ].join('\n');
  const names = files.map((file) => path.basename(file));

  return (
    <div className="mt-4 flex flex-col gap-3">
      <ServerCodeBlock code={setup} lang="bash" codeblock={{ className: 'my-0' }} />
      <Tabs items={names}>
        {files.map((file, index) => (
          <Tab key={file} value={names[index] ?? file}>
            <ServerCodeBlock
              code={sources[index] ?? ''}
              lang="tsx"
              codeblock={{ className: 'my-0' }}
            />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
