import type { ReactNode } from 'react';
import '@react-brackets/theme/theme.css';
import './page.css';

export const metadata = { title: 'react-brackets · Next.js' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
