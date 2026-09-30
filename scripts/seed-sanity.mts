// Fills the Sanity dashboard with the current content from src/data/site.ts,
// uploading the videos and cover images from /public. Run once after creating the Sanity project:
//
//   node --env-file=.env.local scripts/seed-sanity.mts
//
// Needs NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN (an "Editor" token from sanity.io/manage → API → Tokens).
// Running it again replaces the "Website content" document with this file's content.
import { createReadStream } from "node:fs";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { fallbackContent, type Video } from "../src/data/site.ts";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env.local first.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2026-09-01",
  token,
  useCdn: false,
});

const fromPublic = (path: string) => join(process.cwd(), "public", path);
const key = () => randomUUID().slice(0, 12);

async function upload(kind: "file" | "image", path: string) {
  console.log(`  uploading ${path}`);
  const asset = await client.assets.upload(kind, createReadStream(fromPublic(path)), { filename: basename(path) });
  return { _type: kind, asset: { _type: "reference", _ref: asset._id } };
}

async function videoFields(video: Video) {
  return {
    title: video.title,
    video: await upload("file", video.src),
    ...(video.poster ? { poster: await upload("image", video.poster) } : {}),
  };
}

const c = fallbackContent;
console.log("Seeding the dashboard…");
const doc = {
  _id: "site",
  _type: "site",
  name: c.person.name,
  role: c.person.role,
  intro: c.person.intro,
  email: c.person.email,
  tools: c.tools.map((t) => ({ _key: key(), _type: "tool", name: t.name })),
  bio: c.bio,
  services: c.services.map((s) => ({ _key: key(), _type: "service", ...s })),
  showreel: await videoFields(c.showreel),
  categories: [] as object[],
};
for (const category of c.categories) {
  const videos = [];
  for (const video of category.videos) videos.push({ _key: key(), _type: "work", ...(await videoFields(video)) });
  doc.categories.push({ _key: key(), _type: "category", name: category.name, videos });
}
await client.createOrReplace(doc);
console.log("Done. Open /studio to see it.");
