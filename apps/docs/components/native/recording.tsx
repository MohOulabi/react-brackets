const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** A screen recording of the React Native example app, framed as a phone. */
export function Recording({ slug, label }: { slug: string; label: string }) {
  return (
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
}
