"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefersReducedMotion, setLenis } from "@/lib/scroll";

// Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger animations stay in sync.
// Touch screens keep native scrolling: Lenis doesn't smooth touch anyway, it only adds work every frame,
// and while stopped (player open) it cancels every touchmove, which broke the player's seek bar on phones.
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (prefersReducedMotion() || matchMedia("(pointer: coarse)").matches) return;

    const lenis = new Lenis();
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
