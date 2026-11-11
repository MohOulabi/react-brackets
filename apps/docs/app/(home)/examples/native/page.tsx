import type { Metadata } from 'next';
import { Gallery } from '@/components/examples/gallery';
import { NativeSource } from '@/components/examples/source';
import { Recording } from '@/components/native/recording';
import { repository } from '@/lib/layout.shared';
import { nativeExamples } from '@/lib/native-examples';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'React Native examples',
  description:
    'Screens from the Expo example app built with @react-brackets/native, recorded on an iPhone: every format, live scores, an esports bracket, custom cards, theming and right to left, each with its code.',
  alternates: { canonical: '/examples/native' },
};

const groups = nativeExamples;

const count = groups.reduce((total, group) => total + group.examples.length, 0);

export default function NativeExamplesPage() {
  return (
    <Gallery
      platform="native"
      repository={repository}
      intro={
        <>
          {count} screens from the Expo app in the repository, recorded on an iPhone, with all of
          their code. To run them, clone the repository and run{' '}
          <code className="text-foreground">bun run ios</code> in{' '}
          <code className="text-foreground">examples/native</code>.
        </>
      }
      groups={groups.map((group) => ({
        title: group.title,
        examples: group.examples.map(({ slug, title, summary }) => ({
          id: slug,
          title,
          summary,
          path: `examples/native/src/examples/${slug}`,
          preview: (
            <Recording slug={slug} label={`${title}, recorded on an iPhone`} source={false} />
          ),
          code: <NativeSource slug={slug} />,
        })),
      }))}
    />
  );
}
