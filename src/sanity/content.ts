import { createClient, defineQuery } from "next-sanity";
import { fallbackContent, type SiteContent, type Tool, type Video } from "@/data/site";
import { socialPlatforms, type SocialLink } from "@/data/socials";
import { apiVersion, dataset, isSanityConfigured, projectId } from "./env";

const client = createClient({ projectId: projectId || "unset", dataset, apiVersion, useCdn: true });

const videoProjection = `title, "src": coalesce(video.asset->url, videoUrl), "poster": poster.asset->url`;
const siteQuery = defineQuery(`*[_type == "site" && _id == "site"][0]{
  name, role, intro, email, bio,
  tools,
  "toolLogos": tools[_type == "tool" && defined(logo)]{ _key, "url": logo.asset->url },
  services[]{ name, icon },
  socials[]{ platform, name, url, "logo": logo.asset->url },
  hero{ "sky": sky.asset->url, "mid": mid.asset->url, "front": front.asset->url },
  showreel{ ${videoProjection} },
  categories[]{ "id": _key, name, videos[]{ ${videoProjection} } }
}`);

type RawVideo = { title?: string | null; src?: string | null; poster?: string | null } | null;
const toVideo = (v: RawVideo): Video | null => (v?.src ? { title: v.title ?? "", src: v.src, poster: v.poster ?? undefined } : null);

// Tools used to be plain names; now they're { name, logo }. Accept both until scripts/migrate-tools.mts has run.
type RawTool = string | { _key?: string; name?: string | null } | null;
const toTools = (raw: RawTool[], logos: { _key: string; url: string }[] | null): Tool[] =>
  raw
    .map((t) => {
      if (typeof t === "string") return { name: t };
      const logo = logos?.find((l) => l._key === t?._key)?.url;
      return { name: t?.name ?? "", logo };
    })
    .filter((t) => t.name);

type RawSocial = { platform?: string | null; name?: string | null; url?: string | null; logo?: string | null } | null;
const toSocials = (raw: RawSocial[]): SocialLink[] =>
  raw.flatMap((s): SocialLink[] => {
    if (!s?.url || !s.platform) return [];
    if (s.platform in socialPlatforms) {
      const platform = s.platform as keyof typeof socialPlatforms;
      return [{ platform, name: socialPlatforms[platform].name, url: s.url }];
    }
    return s.name ? [{ platform: "other" as const, name: s.name, url: s.url, logo: s.logo ?? undefined }] : [];
  });

// The site's content: from the Sanity dashboard when connected, otherwise src/data/site.ts.
// Any field left empty in the dashboard falls back to the value in site.ts.
// Cached and tagged "site": /api/revalidate refreshes it when the owner publishes, and it re-checks every 60 s anyway.
export async function getContent(): Promise<SiteContent> {
  if (!isSanityConfigured) return fallbackContent;

  const data = await client.fetch(siteQuery, {}, { next: { revalidate: 60, tags: ["site"] } }).catch((error) => {
    console.error("Sanity fetch failed, using fallback content", error);
    return null;
  });
  if (!data) return fallbackContent;

  const f = fallbackContent;
  const categories = (data.categories ?? [])
    .map((c: { id: string; name?: string | null; videos?: RawVideo[] | null }) => ({
      id: c.id,
      name: c.name ?? "",
      videos: (c.videos ?? []).map(toVideo).filter((v): v is Video => v !== null),
    }))
    .filter((c: { videos: Video[] }) => c.videos.length > 0);

  return {
    person: {
      name: data.name || f.person.name,
      role: data.role || f.person.role,
      intro: data.intro || f.person.intro,
      email: data.email || f.person.email,
    },
    bio: data.bio?.length ? data.bio : f.bio,
    services: data.services?.length ? data.services.map((s: { name?: string; icon?: string }) => ({ name: s.name ?? "", icon: s.icon ?? "play" })) : f.services,
    socials: toSocials(data.socials ?? []),
    // the dashboard's layers replace all three demo layers as soon as any one is uploaded
    hero: data.hero?.sky || data.hero?.mid || data.hero?.front ? { sky: data.hero.sky ?? undefined, mid: data.hero.mid ?? undefined, front: data.hero.front ?? undefined } : f.hero,
    tools: data.tools?.length ? toTools(data.tools, data.toolLogos) : f.tools,
    showreel: toVideo(data.showreel) ?? f.showreel,
    categories: categories.length ? categories : f.categories,
  };
}
