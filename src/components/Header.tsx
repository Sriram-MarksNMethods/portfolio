"use client";

import { Fragment, useEffect, useState } from "react";
import { scrollToSection } from "@/lib/scroll";

// Fixed top bar. See-through with paper text over the hero, solid paper with an ink rule after it.
// The hero name flies into the name slot on scroll; <Hero> shows and hides this name while that happens.
export default function Header({ name }: { name: string }) {
  const [overHero, setOverHero] = useState(true);
  const initials = name.split(/\s+/).filter(Boolean).map((word) => word[0]);

  useEffect(() => {
    const update = () => {
      const hero = document.getElementById("hero");
      const bar = document.querySelector("header");
      if (hero && bar) setOverHero(window.scrollY < hero.offsetHeight - bar.offsetHeight);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-20 flex h-(--bar-h) items-center justify-between gap-3 border-b-2 px-5 transition-colors duration-300 ${
        overHero ? "border-transparent bg-transparent text-paper" : "border-ink bg-paper text-ink"
      }`}
    >
      <button
        type="button"
        data-bar-name
        aria-label={name}
        onClick={() => scrollToSection("")}
        className="font-display leading-[.9] whitespace-nowrap uppercase"
      >
        {/* phones show the initials with a dot between them (M.O), larger screens the full name */}
        <span className="text-[34px] sm:hidden">
          {initials.map((letter, i) => (
            <Fragment key={i}>
              {i > 0 && <span>.</span>}
              <span data-bar-initial className="inline-block">
                {letter}
              </span>
            </Fragment>
          ))}
        </span>
        <span className="hidden text-[34px] sm:inline">{name}</span>
      </button>
      <nav className="flex gap-3.5 min-[400px]:gap-[18px] sm:gap-[26px]">
        {[
          ["about", "About me"],
          ["contact", "Contact"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollToSection(id)}
            className="py-3 font-mono text-xs font-semibold tracking-[.06em] whitespace-nowrap uppercase hover:text-signal min-[400px]:text-[13px] min-[400px]:tracking-[.08em] sm:text-sm"
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
