import { createClient, defineQuery } from "next-sanity";
import { fallbackContent, type SiteContent, type Video } from "@/data/site";
import { apiVersion, dataset, isSanityConfigured, projectId } from "./env";

const client = createClient({ projectId: projectId || "unset", dataset, apiVersion, useCdn: true });

const videoProjection = `title, "src": coalesce(video.asset->url, videoUrl), "poster": poster.asset->url`;
const siteQuery = defineQuery(`*[_type == "site" && _id == "site"][0]{
  name, role, intro, email, tools, bio,
  services[]{ name, icon },
  showreel{ ${videoProjection} },
  categories[]{ "id": _key, name, videos[]{ ${videoProjection} } }
}`);

type RawVideo = { title?: string | null; src?: string | null; poster?: string | null } | null;
const toVideo = (v: RawVideo): Video | null => (v?.src ? { title: v.title ?? "", src: v.src, poster: v.poster ?? undefined } : null);

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
    tools: data.tools?.length ? data.tools : f.tools,
    showreel: toVideo(data.showreel) ?? f.showreel,
    categories: categories.length ? categories : f.categories,
  };
}
