"use client";

import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { Tool } from "@/data/site";
import { ToolLogo } from "./icons";

// The tool logos scrolling past in an endless loop along the bottom of the hero (Embla + AutoScroll).
// The list is repeated so the loop never runs out of logos, even on wide screens; only the first copy is read out.
const COPIES = 3;

export default function ToolsMarquee({ tools }: { tools: Tool[] }) {
  const reduced = useReducedMotion();
  const [viewportRef, embla] = useEmblaCarousel(
    { loop: true, dragFree: true, align: "start" },
    reduced ? [] : [AutoScroll({ speed: 0.8, startDelay: 0, stopOnInteraction: false, stopOnMouseEnter: false })],
  );
  // AutoScroll moves the strip from JavaScript every frame; pause it once the hero has scrolled away
  useEffect(() => {
    const autoScroll = embla?.plugins().autoScroll;
    const root = embla?.rootNode();
    if (!autoScroll || !root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) autoScroll.play();
      else autoScroll.stop();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [embla]);

  const slides = Array.from({ length: COPIES }, (_, copy) => tools.map((tool) => ({ tool, copy }))).flat();

  return (
    <div
      ref={viewportRef}
      aria-label="Tools"
      role="region"
      className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
    >
      <ul className="m-0 flex list-none p-0">
        {slides.map(({ tool, copy }, i) => (
          <li
            key={i}
            aria-hidden={copy > 0 || undefined}
            className="flex min-w-0 flex-none items-center gap-2.5 pl-7 text-[15px] leading-tight whitespace-nowrap sm:pl-10 sm:text-base"
          >
            <ToolLogo tool={tool} className="size-[26px] flex-none sm:size-[30px]" />
            <span>{tool.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
