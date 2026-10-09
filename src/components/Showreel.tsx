"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Category, Video } from "@/data/site";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { runtime, timecode } from "@/lib/timecode";
import VideoModal from "./VideoModal";

// Zoom parallax: the reel plays in the middle of six stills. On scroll every layer scales up,
// the stills fly past the edges and the reel grows to exactly full screen (25vw × 25vh scaled 4×), then holds.
// Each still: its box (position and size) and how much it scales by the end.
const stills = [
  { box: "-top-[30vh] left-[5vw] h-[30vh] w-[35vw]", scale: 5 },
  { box: "-top-[10vh] -left-[25vw] h-[45vh] w-[20vw]", scale: 6 },
  { box: "left-[27.5vw] h-[25vh] w-[25vw]", scale: 5 },
  { box: "top-[27.5vh] left-[5vw] h-[25vh] w-[20vw]", scale: 6 },
  { box: "top-[27.5vh] -left-[22.5vw] h-[25vh] w-[30vw]", scale: 8 },
  { box: "top-[22.5vh] left-[25vw] h-[15vh] w-[15vw]", scale: 9 },
];
type Open = { videos: Video[]; index: number; label: string; origin: HTMLElement | null };

export default function Showreel({ showreel, categories }: { showreel: Video; categories: Category[] }) {
  // the stills: videos that have a cover image, taking one from each category in turn
  const withPosters = categories.flatMap((category) =>
    category.videos.map((video, index) => ({ category, index, video })).filter(({ video }) => video.poster),
  );
  const byCategory = categories.map((c) => withPosters.filter((w) => w.category === c));
  const ordered = byCategory.flatMap((_, round) => byCategory.map((list) => list[round])).filter(Boolean);
  const pool = [...ordered, ...withPosters.filter((w) => !ordered.includes(w))];
  const stillVideos = pool.length ? stills.map((_, i) => pool[i % pool.length]) : [];

  const sectionRef = useRef<HTMLElement>(null);
  const reelRef = useRef<HTMLVideoElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const animated = !useReducedMotion();
  // the running timecode is written straight to the DOM: a React update ~4× a second re-rendered the whole
  // section (stills included) in the middle of the scroll zoom
  const timeRef = useRef<HTMLSpanElement>(null);
  const [length, setLength] = useState(showreel.duration ?? 0);
  const [open, setOpen] = useState<Open | null>(null);

  useEffect(() => {
    if (!animated) return;
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current!;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true } });
      section.querySelectorAll<HTMLElement>("[data-scale]").forEach((layer) => {
        tl.to(layer, { scale: Number(layer.dataset.scale), ease: "none", duration: 0.7 }, 0);
      });
      tl.fromTo(captionRef.current, { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.7).to({}, { duration: 0.24 });
    }, section);
    return () => ctx.revert();
  }, [animated]);

  // the inline reel only plays while its section is on screen and the player is closed
  const playerOpen = open !== null;
  useEffect(() => {
    const reel = reelRef.current!;
    if (playerOpen) {
      reel.pause();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? reel.play().catch(() => {}) : reel.pause()), {
      rootMargin: "-1px", // the section starts right at the hero's bottom edge; touching it isn't being on screen
    });
    observer.observe(sectionRef.current ?? reel);
    return () => observer.disconnect();
  }, [animated, playerOpen]);

  const openReel = () => setOpen({ videos: [showreel], index: 0, label: "Showreel", origin: null });

  const reel = (
    <video
      ref={reelRef}
      src={showreel.src}
      poster={showreel.poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="Showreel preview"
      onClick={openReel}
      onTimeUpdate={(e) => {
        if (timeRef.current) timeRef.current.textContent = timecode(e.currentTarget.currentTime);
      }}
      onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
      className="block size-full cursor-pointer bg-black object-cover"
    />
  );

  const caption = (
    <div ref={captionRef} className="flex flex-wrap items-end justify-between gap-3">
      <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 bg-ink px-3 py-2.5 font-mono text-[13px] tracking-[.06em] text-paper uppercase tabular-nums">
        <span>{showreel.title}</span>
        <span>
          <span ref={timeRef}>{timecode(0)}</span> / {timecode(length)}
        </span>
      </p>
      <button
        type="button"
        onClick={openReel}
        className="group inline-flex items-center gap-3 bg-paper py-3 pr-[18px] pl-3.5 font-mono text-[13px] tracking-[.06em] text-ink uppercase hover:bg-ink hover:text-paper"
      >
        <i className="size-0 border-y-[7px] border-l-12 border-y-transparent border-l-signal" />
        Watch full reel{length ? ` · ${runtime(length)}` : ""}
      </button>
    </div>
  );

  return (
    <>
      {animated ? (
        <section ref={sectionRef} aria-label="Showreel" className="relative h-[350vh]">
          <div className="sticky top-0 h-svh overflow-hidden">
            <div data-scale={4} className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="pointer-events-auto relative h-[25vh] w-[25vw]">{reel}</div>
            </div>
            {stillVideos.map(({ category, index, video }, i) => {
              const still = stills[i];
              return (
                <div key={i} data-scale={still.scale} className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <button
                    type="button"
                    aria-label={`Play ${video.title}`}
                    onClick={(e) => setOpen({ videos: category.videos, index, label: category.name, origin: e.currentTarget })}
                    className={`pointer-events-auto relative ${still.box}`}
                  >
                    <Image src={video.poster!} alt="" fill sizes="35vw" className="object-cover" />
                  </button>
                </div>
              );
            })}
            <div className="absolute inset-x-5 bottom-5">{caption}</div>
          </div>
        </section>
      ) : (
        // reduced motion: just the reel at 16:9 with its caption underneath
        <section ref={sectionRef} aria-label="Showreel" className="px-5 pt-5">
          <div className="-mx-5 aspect-video max-h-[92vh]">{reel}</div>
          <div className="pt-3">{caption}</div>
        </section>
      )}

      {open && (
        <VideoModal
          videos={open.videos}
          index={open.index}
          label={open.label}
          origin={open.origin}
          onIndexChange={(index) => setOpen({ ...open, index })}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
