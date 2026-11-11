'use client';

import { Check, Copy, FileText } from 'lucide-react';
import { useState } from 'react';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Copy the page as Markdown, or open it, for pasting into an AI assistant or reading as plain text. */
export function PageActions({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);
  const href = `${base}${markdown}`;
  const link =
    'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground';

  const copy = async () => {
    const text = await fetch(href).then((response) => response.text());
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="not-prose flex flex-wrap gap-2">
      <button type="button" className={link} onClick={copy}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Copied' : 'Copy page'}
      </button>
      <a className={link} href={href}>
        <FileText className="size-3.5" />
        Markdown
      </a>
    </div>
  );
}
