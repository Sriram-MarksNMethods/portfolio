// Seconds → "HH:MM:SS:FF" at 25 fps, the way editors read time.
export function timecode(seconds: number, fps = 25) {
  const frames = Math.floor((seconds || 0) * fps);
  const parts = [
    Math.floor(frames / fps / 3600),
    Math.floor(frames / fps / 60) % 60,
    Math.floor(frames / fps) % 60,
    frames % fps,
  ];
  return parts.map((n) => String(n).padStart(2, "0")).join(":");
}

// Seconds → "MM:SS" for short labels.
export function runtime(seconds: number) {
  return timecode(seconds).slice(3, 8);
}
