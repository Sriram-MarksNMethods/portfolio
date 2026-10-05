"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HeroLayers, SiteContent, Tool } from "@/data/site";
import { prefersReducedMotion } from "@/lib/scroll";
import ToolsMarquee from "./ToolsMarquee";

// Parallax layers, back to front. The name sits between the mid and front layers,
// so the ground and the standing figure pass in front of it (the "depth wallpaper" effect).
// yPercent = how far each layer drifts down while the hero scrolls away.
const drift = { sky: 70, mid: 55, front: 10 };

// Anton capitals average about 0.475em wide. Used to send the name from the server already close to its fitted
// size and centred, so a slow connection never shows a tiny name that jumps; the fit below then makes it exact.
const approxSize = (name: string) => `calc((100vw - 40px) / ${(name.length * 0.475).toFixed(2)})`;

export default function Hero({ person, tools, layers }: { person: SiteContent["person"]; tools: Tool[]; layers: HeroLayers }) {
  const heroRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  // Fit the name to the full width on one line, then centre it vertically.
  useEffect(() => {
    const fit = () => {
      const hero = heroRef.current, name = nameRef.current, line = lineRef.current;
      if (!hero || !name || !line) return;
      line.style.fontSize = "100px";
      line.style.fontSize = `${((100 * name.clientWidth) / line.scrollWidth) * 0.995}px`;
      hero.style.setProperty("--name-top", `${(hero.clientHeight - name.offsetHeight) / 2}px`);
      ScrollTrigger.refresh();
    };
    document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [person.name]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    const hero = heroRef.current!, name = nameRef.current!, line = lineRef.current!;
    const barName = document.querySelector<HTMLElement>("[data-bar-name]")!;

    const ctx = gsap.context(() => {
      // letters rise in once on load
      gsap.from(line.children, { yPercent: 60, opacity: 0, duration: 0.7, delay: 0.12, stagger: 0.04, ease: "power3.out" });

      // parallax: each layer drifts down at its own rate while the hero scrolls away
      const parallax = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      hero.querySelectorAll<HTMLElement>("[data-y]").forEach((layer) => {
        parallax.to(layer, { yPercent: Number(layer.dataset.y), ease: "none" }, 0);
      });

      // Over the first half of the hero's scroll the name flies into the header. While it flies the
      // header name is hidden; once it lands, the header name takes over.
      const flyDistance = () => hero.offsetHeight * 0.5;
      const setDocked = (docked: boolean) => {
        barName.style.opacity = docked ? "1" : "0";
        name.style.visibility = docked ? "hidden" : "visible";
      };
      const flight = () =>
        gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: () => `+=${flyDistance()}`,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => setDocked(self.progress > 0.995),
          },
        });
      // how far to move a box (measured without transforms, relative to the hero) so it lands on a header box
      const landOn = (box: { left: number; top: number; width: number }, target: Element) => {
        const t = target.getBoundingClientRect();
        return { x: t.left - box.left, y: t.top + flyDistance() - box.top, scale: t.width / box.width };
      };
      setDocked(false);

      const mm = gsap.matchMedia();
      // desktop and tablet: the whole name shrinks into the full name in the header
      mm.add("(min-width: 640px)", () => {
        const box = () => ({ left: name.offsetLeft + line.offsetLeft, top: name.offsetTop + line.offsetTop, width: line.offsetWidth });
        flight()
          .to(name, { x: () => landOn(box(), barName).x, y: () => landOn(box(), barName).y, scale: () => landOn(box(), barName).scale, transformOrigin: "0 0", ease: "power2.inOut" }, 0)
          .to(introRef.current, { opacity: 0, ease: "none", duration: 0.25 }, 0);
      });
      // phones: the other letters fade out and only the initials fly into the header, where a dot sits between them
      mm.add("(max-width: 639.98px)", () => {
        const letters = [...line.children] as HTMLElement[];
        const initials = letters.filter((l) => l.dataset.initial !== undefined);
        const barInitials = [...document.querySelectorAll("[data-bar-initial]")];
        const tl = flight()
          .to(letters.filter((l) => l.dataset.initial === undefined), { opacity: 0, ease: "none", duration: 0.35 }, 0)
          .to(introRef.current, { opacity: 0, ease: "none", duration: 0.25 }, 0);
        initials.forEach((letter, k) => {
          // letters are positioned inside the <h1>, which is positioned inside the hero
          const box = () => ({ left: name.offsetLeft + letter.offsetLeft, top: name.offsetTop + letter.offsetTop, width: letter.offsetWidth });
          const to = () => landOn(box(), barInitials[k]);
          tl.to(letter, { x: () => to().x, y: () => to().y, scale: () => to().scale, transformOrigin: "0 0", ease: "power2.inOut", duration: 1 }, 0);
        });
      });
    }, hero);

    return () => {
      ctx.revert();
      barName.style.opacity = "";
    };
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      style={{ "--name-top": `calc(50% - ${approxSize(person.name)} * 0.45)` } as React.CSSProperties}
      className="relative h-svh overflow-hidden bg-ink text-paper"
    >
      {(["sky", "mid"] as const).map((layer) => layers[layer] && <HeroLayer key={layer} src={layers[layer]} yPercent={drift[layer]} />)}

      <h1
        ref={nameRef}
        aria-label={person.name}
        className="absolute inset-x-5 top-(--name-top) m-0 font-display leading-[.9] uppercase"
      >
        <span ref={lineRef} style={{ fontSize: approxSize(person.name) }} className="block w-max whitespace-nowrap" aria-hidden="true">
          {[...person.name].map((ch, i) => (
            <span
              key={i}
              data-initial={ch !== " " && (i === 0 || person.name[i - 1] === " ") ? "" : undefined}
              className="inline-block whitespace-pre"
            >
              {ch}
            </span>
          ))}
        </span>
      </h1>

      {layers.front && <HeroLayer src={layers.front} yPercent={drift.front} />}

      <div ref={introRef} className="absolute inset-x-5 top-[calc(var(--bar-h)+24px)] z-10">
        {/* one line on phones too: the type shrinks with the screen below 394px */}
        <p className="m-0 font-mono text-[min(13px,3.3vw)] tracking-[.06em] whitespace-nowrap uppercase sm:text-[13px]">{person.role}</p>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-10 sm:bottom-5">
        <ToolsMarquee tools={tools} />
      </div>
    </section>
  );
}

function HeroLayer({ src, yPercent }: { src: string; yPercent: number }) {
  return (
    <div data-y={yPercent} className="absolute inset-0">
      {/* object-cover on a tall phone screen shows a 16:9 layer at the screen's height, about 1.8× its width */}
      <Image src={src} alt="" fill priority sizes="max(100vw, 178vh)" className="object-cover" />
    </div>
  );
}
