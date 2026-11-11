import { Banner } from 'fumadocs-ui/components/banner';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Closing it hides it for good in that browser; a new `id` brings the next announcement back. */}
      <Banner
        id="react-native"
        height="2.75rem"
        className="bg-optic text-[#10213f] [&>button]:text-[#10213f]/60 [&>button]:hover:bg-[#10213f]/10 [&>button]:hover:text-[#10213f]"
      >
        <Link
          href="/docs/native"
          className="flex min-w-0 items-center gap-2 pe-8 underline-offset-4 hover:underline"
        >
          <span className="shrink-0 rounded-full bg-[#10213f] px-2 py-0.5 text-xs font-semibold text-optic">
            New
          </span>
          <span className="truncate">
            <strong className="font-semibold">React Native is here.</strong>
            <span className="hidden sm:inline">
              {' '}
              The same brackets on iOS and Android, swiped and zoomed on the UI thread.
            </span>
          </span>
        </Link>
      </Banner>
      <HomeLayout {...baseOptions()}>{children}</HomeLayout>
    </>
  );
}
