import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

// True when the visitor asked for less motion. On the server it answers true,
// so the first HTML is the calm version and the animated one takes over after hydration.
export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}
