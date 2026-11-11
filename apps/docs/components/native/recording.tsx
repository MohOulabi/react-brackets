import { nativeExampleTitle } from '@/lib/native-examples';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * A screen recording of the React Native example app, framed as a phone. In the docs it says which example it is,
 * since the code beside it is often a shorter version of that screen.
 */
export function Recording({
  slug,
  label,
  source = true,
}: {
  slug: string;
  label: string;
  /** Links to the example's full code under the phone. Off where the code is already beside it. */
  source?: boolean;
}) {
  const phone = (
    <div className="not-prose mx-auto w-[min(100%,272px)] shrink-0 rounded-[2.6rem] bg-zinc-950 p-[9px] shadow-[0_24px_60px_-28px_rgb(16_33_63/0.55)] ring-1 ring-black/10 dark:ring-white/12">
      {/* biome-ignore lint/performance/noImgElement: an animated image, played as it is */}
      <img
        src={`${base}/native/${slug}.webp`}
        alt={label}
        width={360}
        height={782}
        loading="lazy"
        className="block h-auto w-full rounded-[2.1rem] bg-white"
      />
    </div>
  );
  if (!source) return phone;
  const name = nativeExampleTitle(slug) ?? slug;
  return (
    <figure className="not-prose mx-auto flex w-[min(100%,272px)] shrink-0 flex-col items-center gap-3">
      {phone}
      <figcaption className="text-center text-xs text-fd-muted-foreground">
        The{' '}
        <a
          href={`${base}/examples/native#${slug}`}
          className="font-medium text-fd-foreground underline underline-offset-4"
        >
          {name}
        </a>{' '}
        example, recorded on an iPhone
      </figcaption>
    </figure>
  );
}
