"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { timecode } from "@/lib/timecode";

const FRAMES = 250; // 10 s at 25 fps
const DURATION = 2400; // ms for the bar to fill

// Slow start, quick middle, slow finish, like a real render.
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// The thank-you page: an After Effects-style render queue renders the visitor's message, then says it's done.
export default function RenderQueue({ file }: { file: string }) {
  const [progress, setProgress] = useState(0);
  const done = progress >= 1;

  useEffect(() => {
    // reduced motion: straight to the finished state on the first frame
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = reduced ? -Infinity : performance.now() + 300; // a short beat before it starts
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / DURATION, 0), 1);
      setProgress(ease(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const current = Math.round(progress * FRAMES);

  return (
    <main className="grid min-h-svh place-items-center bg-ink px-5 py-16 text-paper">
      <div className="w-full max-w-[880px]">
        <div className="flex items-center justify-between border-b-2 border-paper pb-2.5 font-mono text-[13px] tracking-[.06em] uppercase">
          <span>Render queue</span>
          <span className={done ? "text-paper" : "text-paper/60"}>{done ? "Done" : "Rendering…"}</span>
        </div>

        <div className="grid gap-3 py-6">
          <p className="m-0 font-mono text-[clamp(16px,2vw,22px)] font-semibold [overflow-wrap:anywhere]">{file}</p>
          <div
            role="progressbar"
            aria-label={`Rendering ${file}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="h-3 bg-paper/15"
          >
            <div className="h-full origin-left bg-signal" style={{ transform: `scaleX(${progress})` }} />
          </div>
          <div className="flex justify-between gap-4 font-mono text-[13px] tracking-[.06em] text-paper/70 uppercase tabular-nums">
            <span>
              Frame {String(current).padStart(4, "0")} / {String(FRAMES).padStart(4, "0")}
            </span>
            <span>{Math.round(progress * 100)}%</span>
            <span>{timecode(current / 25)}</span>
          </div>
        </div>

        {/* always in the layout (hidden until done) so the queue doesn't jump when it appears */}
        <div
          aria-hidden={!done}
          className={`grid gap-5 pt-6 transition-[opacity,translate,visibility] duration-700 ease-out motion-reduce:transition-none ${
            done ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0"
          }`}
        >
          <h1 className="m-0 font-display text-[clamp(56px,11vw,150px)] leading-[.9] uppercase">
            Render complete{" "}
            <svg viewBox="0 0 24 24" aria-hidden="true" className="inline-block size-[.62em] align-baseline text-signal">
              <path d="M3 12.5 9.5 19 21 5.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" />
            </svg>
          </h1>
          <p className="m-0 max-w-[30ch] text-[clamp(19px,2vw,26px)] leading-[1.35]">Thanks, your message is on its way. I&apos;ll reply by email.</p>
          <Link
            href="/"
            tabIndex={done ? undefined : -1}
            className="inline-flex w-fit items-center gap-3.5 border-2 border-paper px-5 py-3.5 font-mono text-[13px] tracking-[.06em] uppercase hover:bg-paper hover:text-ink"
          >
            <span aria-hidden="true">←</span> Back to the site
          </Link>
        </div>
        <p role="status" className="sr-only">
          {done ? "Render complete. Thanks, your message is on its way. I'll reply by email." : ""}
        </p>
      </div>
    </main>
  );
}
