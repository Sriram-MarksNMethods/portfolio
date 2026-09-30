// The site's content. When a Sanity project is connected (see src/sanity), the dashboard at /studio
// is the source of truth and this file is only the fallback / starting content for the seed script.
// Videos and posters are files in /public/videos (MP4 + JPG).

import type { SocialLink } from "./socials";

export type Video = {
  title: string;
  src: string;
  poster?: string;
  duration?: number; // seconds; optional, the player reads the real length from the file
};

export type Category = {
  id: string;
  name: string;
  videos: Video[];
};

export const person = {
  name: "Marcus Okafor", // placeholder: replace with the real name
  role: "Motion designer & video editor",
  intro: "Logos, titles, reels and music videos. I make the still things move, frame by frame.",
  email: "hello@example.com", // placeholder
};

export const bio = [
  "I'm Marcus, a motion designer and video editor. My job is the part people feel before they notice it: how a logo arrives, how long a title holds before the cut, where the frame changes on the beat.",
  "I take a project the whole way, from styleframe to final render: concept, design, animation, edit and grade. I work with brands, studios and artists, and I'm open to freelance.",
];

export const services = [
  { name: "Brand motion & logo animation", icon: "play" },
  { name: "Title sequences", icon: "title" },
  { name: "Explainers & product films", icon: "film" },
  { name: "Music & lyric videos", icon: "music" },
  { name: "Editing & colour", icon: "grade" },
] as const;

export const tools = [
  "After Effects",
  "Cinema 4D",
  "Blender",
  "Premiere Pro",
  "DaVinci Resolve",
  "Figma",
  "Illustrator",
] as const;

// Links under the email in Contact. Empty here; the owner adds them in the dashboard.
export const socials: SocialLink[] = [];

// Hero parallax layers, back to front: sky (furthest), mid (behind the name), front (in front of the name, with the figure).
// These are demo layers; the owner replaces them in the dashboard (Hero tab). A layer can be left empty.
export type HeroLayers = { sky?: string; mid?: string; front?: string };
export const hero: HeroLayers = { sky: "/hero/plx-sky.webp", mid: "/hero/plx-mountain.webp", front: "/hero/plx-ground.webp" };

export const showreel: Video = {
  title: "Showreel 2025",
  src: "/videos/showreel.mp4",
  poster: "/videos/showreel.jpg",
  duration: 18,
};

const video = (file: string, title: string, duration = 8): Video => ({
  title,
  src: `/videos/${file}.mp4`,
  poster: `/videos/${file}.jpg`,
  duration,
});

export const categories: Category[] = [
  {
    id: "logo",
    name: "Logo animations",
    videos: [
      video("logo-01", "Logo animation 01"),
      video("logo-02", "Logo animation 02"),
      video("logo-03", "Logo animation 03"),
      video("logo-04", "Logo animation 04"),
    ],
  },
  {
    id: "ai",
    name: "AI videos",
    videos: [video("ai-01", "AI video 01"), video("ai-02", "AI video 02"), video("ai-03", "AI video 03")],
  },
  {
    id: "story",
    name: "Story reels",
    videos: [video("story-01", "Story reel 01"), video("story-02", "Story reel 02"), video("story-03", "Story reel 03")],
  },
  {
    id: "others",
    name: "Others",
    videos: [video("other-01", "Project 01"), video("other-02", "Project 02"), video("other-03", "Project 03")],
  },
];

// A tool in the hero's logo row. `logo` is an uploaded image URL; without one, the built-in logo for that
// name is used (see src/components/icons.tsx), or a letter tile if there isn't one.
export type Tool = { name: string; logo?: string };

export type SiteContent = {
  person: { name: string; role: string; intro: string; email: string };
  bio: string[];
  services: { name: string; icon: string }[];
  socials: SocialLink[];
  hero: HeroLayers;
  tools: Tool[];
  showreel: Video;
  categories: Category[];
};

export const fallbackContent: SiteContent = {
  person,
  bio,
  services: services.map((s) => ({ ...s })),
  socials,
  hero,
  tools: tools.map((name) => ({ name })),
  showreel,
  categories,
};
