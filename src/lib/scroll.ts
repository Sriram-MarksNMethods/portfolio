import type Lenis from "lenis";

// The one Lenis instance, set by <SmoothScroll>. Null when motion is reduced or before it mounts.
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

// Scroll to a section by id (or the top when id is empty), stopping just below the fixed header.
export function scrollToSection(id: string) {
  const el = id ? document.getElementById(id) : null;
  const barHeight = document.querySelector("header")?.offsetHeight ?? 0;
  const top = el ? el.getBoundingClientRect().top + window.scrollY - barHeight : 0;
  if (lenis) lenis.scrollTo(top);
  else window.scrollTo({ top, behavior: "smooth" });
}

// Freeze page scrolling while a full-screen player is open.
export function lockScroll(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
