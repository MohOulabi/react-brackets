import { RootProvider } from 'fumadocs-ui/provider/next';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import type { ReactNode } from 'react';
import StaticSearchDialog from '@/components/search';
import './global.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' });

export const metadata: Metadata = {
  title: { default: 'react-brackets', template: '%s · react-brackets' },
  description:
    'Headless, responsive tournament brackets for React. Single and double elimination, round robin and Swiss.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <RootProvider search={{ SearchDialog: StaticSearchDialog }}>{children}</RootProvider>
      </body>
    </html>
  );
}
