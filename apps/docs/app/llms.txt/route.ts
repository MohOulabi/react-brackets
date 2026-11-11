import { markdownPath, orderedPages } from '@/lib/llms';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

/** The llms.txt index: what react-brackets is, and every page with a link to its Markdown. */
export function GET(): Response {
  const pages = orderedPages();
  const list = (native: boolean) =>
    pages
      .filter((page) => page.url.startsWith('/docs/native') === native)
      .map(
        (page) =>
          `- [${page.data.title}](${site.url}${markdownPath(page.url)})${page.data.description ? `: ${page.data.description}` : ''}`,
      )
      .join('\n');

  const text = `# ${site.name}

> ${site.description}

Tournament brackets for React (\`react-brackets\`, headless, with an optional theme in \`@react-brackets/theme\`) and for React Native and Expo (\`@react-brackets/native\`), from one framework-free core (\`@react-brackets/core\`): single and double elimination, round robin, Swiss and groups to playoffs, with seeding, byes, results and standings. On narrow screens the bracket pages through one round at a time; wider screens show the whole tree, scrolled, fitted, or panned and zoomed. Every part, including round navigation and zoom controls, can be restyled, rearranged or replaced, and every gesture is configurable.

- Install for the web: \`npm install react-brackets @react-brackets/theme\`
- Install for React Native: \`npx expo install @react-brackets/native react-native-reanimated react-native-worklets react-native-gesture-handler\`
- Source: ${site.repository}
- Every page in one file: ${site.url}/llms-full.txt

## React docs

${list(false)}

## React Native docs

${list(true)}

## Examples

- [React examples](${site.url}/examples): small apps with their full code, from an esports bracket to live scores and loading states.
- [React Native examples](${site.url}/examples/native): screens from the Expo example app, recorded on an iPhone, with their full code.
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
