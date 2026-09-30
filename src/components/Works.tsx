"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/data/site";
import { runtime } from "@/lib/timecode";
import VideoModal from "./VideoModal";

// Category tabs over a grid of 4:3 videos that loop silently while on screen.
// Clicking a tile opens the full-screen player, which grows out of that tile.
export default function Works({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(0);
  // which video is open, and the tile it belongs to (the player grows out of it and shrinks back into it)
  const [open, setOpen] = useState<{ index: number; tile: HTMLButtonElement | null } | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const category = categories[active];
  // real lengths, read from each file as it loads (the dashboard doesn't ask for them)
  const [lengths, setLengths] = useState<Record<string, number>>({});

  // play tiles only while they're visible
  useEffect(() => {
    const videos = gridRef.current?.querySelectorAll("video") ?? [];
    const observer = new IntersectionObserver((entries) =>
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      }),
    );
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [active]);

  // arrow keys move between tabs (standard tablist behaviour)
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = (i + step + categories.length) % categories.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="works" className="px-5">
      <div className="mt-[70px] flex items-baseline justify-between gap-3 border-t-[3px] border-ink pt-2.5 pb-[18px]">
        <h2 className="m-0 font-display text-[clamp(34px,5vw,64px)] leading-[.9] uppercase">Frame by frame</h2>
        <span className="font-mono text-[13px] tracking-[.06em] uppercase">{String(category.videos.length).padStart(2, "0")} videos</span>
      </div>

      <div role="tablist" aria-label="Work categories" className="mb-[22px] grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {categories.map((c, i) => (
          <button
            key={c.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${c.id}`}
            aria-selected={i === active}
            aria-controls="works-grid"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onTabKey(e, i)}
            className={`border-2 border-ink px-2 py-[13px] font-mono text-xs leading-none font-semibold tracking-[.04em] whitespace-nowrap uppercase sm:px-[18px] sm:text-[13px] sm:tracking-[.08em] ${
              i === active ? "bg-ink text-paper" : "hover:bg-ink/10"
            } ${
              // phones show two tabs per row; an odd one out at the end spans the full width
              categories.length % 2 === 1 && i === categories.length - 1 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            {c.name}
            <sup className="ml-1.5 text-[10px] opacity-70">{String(c.videos.length).padStart(2, "0")}</sup>
          </button>
        ))}
      </div>

      <div
        key={category.id}
        ref={gridRef}
        id="works-grid"
        role="tabpanel"
        aria-labelledby={`tab-${category.id}`}
        className="grid grid-cols-1 gap-7 motion-safe:animate-[swap-in_.45s_cubic-bezier(.2,.8,.2,1)] sm:grid-cols-2 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-3"
      >
        {category.videos.map((video, i) => (
          <button
            key={video.src}
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            type="button"
            aria-label={`Play ${video.title}`}
            onClick={(e) => setOpen({ index: i, tile: e.currentTarget })}
            className="group grid min-w-0 gap-2.5 text-left"
          >
            <span className="relative block aspect-[4/3] overflow-hidden bg-black">
              <video
                src={video.src}
                poster={video.poster}
                muted
                loop
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const length = e.currentTarget.duration;
                  setLengths((prev) => ({ ...prev, [video.src]: length }));
                }}
                className="block size-full object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none"
              />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 bg-paper py-2 pr-3 pl-2.5 font-mono text-[13px] tracking-[.06em] text-ink uppercase transition duration-200 pointer-fine:translate-y-1.5 pointer-fine:opacity-0 pointer-fine:group-hover:translate-y-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-visible:translate-y-0 pointer-fine:group-focus-visible:opacity-100">
                <i className="size-0 border-y-[6px] border-l-10 border-y-transparent border-l-signal" />
                Play
              </span>
            </span>
            <span className="flex items-baseline justify-between gap-3 border-t-2 border-ink pt-2">
              <b className="font-display text-[clamp(22px,2.2vw,30px)] leading-none font-normal uppercase">{video.title}</b>
              <span className="font-mono text-[13px] tracking-[.06em]">{runtime(lengths[video.src] ?? video.duration ?? 0)}</span>
            </span>
          </button>
        ))}
      </div>

      {open && (
        <VideoModal
          videos={category.videos}
          index={open.index}
          label={category.name}
          origin={open.tile}
          onIndexChange={(index) => setOpen({ index, tile: tileRefs.current[index] })}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}
