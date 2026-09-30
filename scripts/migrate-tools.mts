// One-time fix after the Tools field changed from plain names to { name, logo }.
// Converts the tools already in the dashboard so they don't show as errors. Safe to run more than once.
//
//   node --env-file=.env.local scripts/migrate-tools.mts
//
// Needs SANITY_WRITE_TOKEN (an Editor token from sanity.io/manage → API → Tokens) in .env.local.
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env.local first.");
  process.exit(1);
}
const client = createClient({ projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production", apiVersion: "2026-09-01", token, useCdn: false });

// the published document and any unpublished draft of it
for (const id of ["site", "drafts.site"]) {
  const doc = await client.getDocument<{ tools?: unknown[] }>(id);
  if (!doc?.tools?.some((t) => typeof t === "string")) {
    console.log(`${id}: nothing to convert`);
    continue;
  }
  const tools = doc.tools.map((t) => (typeof t === "string" ? { _key: randomUUID().slice(0, 12), _type: "tool", name: t } : t));
  await client.patch(id).set({ tools }).commit();
  console.log(`${id}: converted ${tools.length} tools`);
}
console.log("Done.");
