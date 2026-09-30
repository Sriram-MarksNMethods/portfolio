"use client";

import { useEffect, useRef, useState } from "react";
import type { Video } from "@/data/site";
import { lockScroll, prefersReducedMotion } from "@/lib/scroll";
import { timecode } from "@/lib/timecode";

type Props = {
  videos: Video[];
  index: number;
  label: string; // shown top-left, e.g. the category name
  origin: HTMLElement | null; // the tile for the current video: the player grows out of it and shrinks back into it
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const EASE = "cubic-bezier(.65,0,.35,1)";
const insetOf = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px)`;
};

// Full-screen player with its own controls: play/pause, scrub, timecode, prev/next, fullscreen, close.
// Keys: Esc closes, ← → change video, Space plays/pauses.
export default function VideoModal({ videos, index, label, origin, onIndexChange, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openedFrom] = useState(origin); // the tile it grew out of; focus goes back there on close
  const video = videos[index];
  const go = (step: number) => onIndexChange((index + step + videos.length) % videos.length);

  const close = () => {
    const root = rootRef.current;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (!root || !origin || prefersReducedMotion()) return onClose();
    root.animate([{ clipPath: "inset(0px 0px 0px 0px)" }, { clipPath: insetOf(origin) }], { duration: 420, easing: EASE }).onfinish = onClose;
  };

  // open: lock the page, grow out of the tile, focus Close; on unmount give focus back to the tile
  useEffect(() => {
    lockScroll(true);
    closeRef.current?.focus();
    if (openedFrom && !prefersReducedMotion()) {
      rootRef.current?.animate([{ clipPath: insetOf(openedFrom) }, { clipPath: "inset(0px 0px 0px 0px)" }], { duration: 520, easing: EASE });
    }
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      lockScroll(false);
      document.removeEventListener("fullscreenchange", onFullscreen);
      openedFrom?.focus({ preventScroll: true });
    };
  }, [openedFrom]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen().catch(() => {});
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const button = "py-3 font-mono text-[13px] font-semibold tracking-[.08em] uppercase hover:text-signal";

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-40 grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden bg-ink px-5 pt-[calc(8px+env(safe-area-inset-top))] pb-[calc(18px+env(safe-area-inset-bottom))] text-paper"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[13px] tracking-[.06em] uppercase">
          {label} · {String(index + 1).padStart(2, "0")} / {String(videos.length).padStart(2, "0")}
        </span>
        <button ref={closeRef} type="button" onClick={close} className={button}>
          Close ✕
        </button>
      </div>

      <video
        ref={videoRef}
        key={video.src}
        src={video.src}
        poster={video.poster}
        autoPlay
        playsInline
        loop
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="size-full min-h-0 cursor-pointer object-contain"
      />

      <div className="grid gap-2">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
          <button type="button" onClick={togglePlay} className={`${button} min-w-16 text-left`}>
            {playing ? "Pause" : "Play"}
          </button>
          <input
            type="range"
            aria-label="Scrub"
            min={0}
            max={duration || 1}
            step={0.01}
            value={time}
            onChange={(e) => {
              const v = videoRef.current;
              if (v) v.currentTime = Number(e.target.value);
              setTime(Number(e.target.value));
            }}
            className="h-8 w-full accent-signal"
          />
          <span className="font-mono text-xs tabular-nums">
            {timecode(time)} / {timecode(duration)}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <span className="font-display text-[clamp(28px,4vw,52px)] leading-none uppercase">{video.title}</span>
          <div className="flex gap-6">
            {videos.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className={button}>
                  ← Prev
                </button>
                <button type="button" onClick={() => go(1)} className={button}>
                  Next →
                </button>
              </>
            )}
            <button type="button" onClick={toggleFullscreen} className={button}>
              {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
