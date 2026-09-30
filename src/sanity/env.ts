// Sanity connection settings, from .env.local (see .env.example).
// Until a project id is set, the site uses src/data/site.ts and /studio shows setup steps.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2026-09-01";
export const isSanityConfigured = projectId !== "";
