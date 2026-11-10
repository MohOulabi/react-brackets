import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const repository = 'https://github.com/MohOulabi/react-brackets';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="font-semibold tracking-tight">
          react<span className="text-fd-muted-foreground">-brackets</span>
        </span>
      ),
    },
    githubUrl: repository,
    links: [
      { text: 'Docs', url: '/docs', active: 'nested-url' },
      { text: 'Examples', url: '/examples' },
    ],
  };
}
