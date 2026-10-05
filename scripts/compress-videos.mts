// Makes every video in the dashboard web-sized, so the owner can upload files of any size.
//
// For each video file used on the site (showreel + works) that hasn't been done yet, it downloads the upload,
// re-encodes it with ffmpeg to full HD (long side 1920 px: 1920×1080 landscape, 1080×1920 vertical; smaller
// videos keep their size) as H.264 MP4 with fast start, uploads the result and points the site at it.
// Videos that are already web-sized are only marked as done. It then makes a small silent preview of each video
// (short side 640 px, about 1.5 Mbit/s) for the grid tiles, and saves its URL on the video's file as `previewUrl`.
// Runs on GitHub Actions after each publish
// (.github/workflows/compress-videos.yml); you can also run it yourself:
//
//   node --env-file=.env.local scripts/compress-videos.mts               compress everything that's pending
//   node --env-file=.env.local scripts/compress-videos.mts --dry-run     only list what it would do
//   node --env-file=.env.local scripts/compress-videos.mts --delete-originals   also delete the big uploads afterwards
//   node scripts/compress-videos.mts --local in.mov out.mp4              compress one file on this computer (no dashboard)
//
// Needs ffmpeg + ffprobe, NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN (an Editor token). No npm packages.
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

// --- encoding ---------------------------------------------------------------------------------------------

const MAX_LONG_SIDE = 1920;
const MAX_BITRATE = 10_000_000; // bits/s; above this a video counts as "too big" even when it's already 1080p H.264

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} exited with ${code}\n${err.slice(-2000)}`))));
  });
}

type Probe = { codec: string; width: number; height: number; bitrate: number; container: string; hasAudio: boolean };

async function probe(file: string): Promise<Probe> {
  const info = JSON.parse(await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]));
  const video = info.streams.find((s: { codec_type: string }) => s.codec_type === "video");
  if (!video) throw new Error("no video stream");
  return {
    codec: video.codec_name,
    width: video.width,
    height: video.height,
    bitrate: Number(info.format.bit_rate) || 0,
    container: info.format.format_name,
    hasAudio: info.streams.some((s: { codec_type: string }) => s.codec_type === "audio"),
  };
}

// Already fine for the web: H.264 in MP4, at most full HD, modest bitrate.
const isWebReady = (p: Probe) =>
  p.codec === "h264" && p.container.includes("mp4") && Math.max(p.width, p.height) <= MAX_LONG_SIDE && p.bitrate > 0 && p.bitrate <= MAX_BITRATE;

async function encode(input: string, output: string, p: Probe) {
  // Scale so the long side is at most 1920 (never upscale), keep the aspect ratio, even dimensions.
  const scale =
    p.width >= p.height
      ? `scale='min(${MAX_LONG_SIDE},iw)':-2`
      : `scale=-2:'min(${MAX_LONG_SIDE},ih)'`;
  await run("ffmpeg", [
    "-y", "-v", "error", "-i", input,
    "-map", "0:v:0", ...(p.hasAudio ? ["-map", "0:a:0"] : []),
    "-vf", `${scale}:flags=lanczos`,
    // CRF 21 keeps sharp motion-graphics edges; the maxrate cap keeps busy footage from ballooning.
    "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-maxrate", "10M", "-bufsize", "20M",
    "-profile:v", "high", "-pix_fmt", "yuv420p",
    ...(p.hasAudio ? ["-c:a", "aac", "-b:a", "160k"] : []),
    "-movflags", "+faststart",
    output,
  ]);
}

// The preview that loops in a grid tile: short side at most 640 px, no sound, a few hundred KB per 10 s.
async function encodePreview(input: string, output: string, p: Probe) {
  const scale = p.width >= p.height ? `scale=-2:'min(640,ih)'` : `scale='min(640,iw)':-2`;
  await run("ffmpeg", [
    "-y", "-v", "error", "-i", input,
    "-map", "0:v:0", "-an",
    "-vf", `${scale}:flags=lanczos`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-maxrate", "1500k", "-bufsize", "3M",
    "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    output,
  ]);
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// Compresses one file. Returns the path of the smaller web version, or null if the original should be kept.
async function compress(input: string, output: string): Promise<string | null> {
  const p = await probe(input);
  if (isWebReady(p)) {
    console.log(`  already web-sized (${p.width}×${p.height}, ${(p.bitrate / 1e6).toFixed(1)} Mbit/s)`);
    return null;
  }
  console.log(`  encoding ${p.width}×${p.height} ${p.codec}…`);
  await encode(input, output, p);
  const [before, after] = [(await stat(input)).size, (await stat(output)).size];
  // An H.264 MP4 that didn't get smaller is kept as it is; anything else (ProRes, HEVC, 4K…) always gets the web version.
  if (after >= before && p.codec === "h264" && p.container.includes("mp4")) {
    console.log(`  the web version wasn't smaller (${mb(after)} vs ${mb(before)}), keeping the original`);
    return null;
  }
  console.log(`  ${mb(before)} → ${mb(after)}`);
  return output;
}

// --- one local file -----------------------------------------------------------------------------------------

const args = process.argv.slice(2);
if (args[0] === "--local") {
  const [input, output] = args.slice(1);
  if (!input || !output) {
    console.error("Usage: node scripts/compress-videos.mts --local <input> <output.mp4>");
    process.exit(1);
  }
  const result = await compress(input, output);
  if (!result) console.log(`Nothing written: ${input} is fine to upload as it is.`);
  process.exit(0);
}

// --- the dashboard ------------------------------------------------------------------------------------------

const dryRun = args.includes("--dry-run");
const check = args.includes("--check"); // for the workflow: only report whether anything is pending
const deleteOriginals = args.includes("--delete-originals");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN first.");
  process.exit(1);
}
const api = `https://${projectId}.api.sanity.io/v2026-09-01`;
const headers = { Authorization: `Bearer ${token}` };

async function sanity<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${api}${path}`, { ...init, headers: { ...headers, ...init?.headers } });
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}
const query = <T,>(groq: string, params: Record<string, unknown> = {}) =>
  sanity<{ result: T }>(`/data/query/${dataset}?perspective=raw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: groq, params }),
  }).then((r) => r.result);
const mutate = (mutations: object[]) =>
  sanity(`/data/mutate/${dataset}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mutations }) });

type SiteDoc = { _id: string; _rev: string; showreel?: unknown; categories?: unknown };
type Asset = { _id: string; url: string; size: number; originalFilename?: string; webOptimized?: boolean; previewUrl?: string };

// Every file asset referenced from the published site doc and its draft (video fields are the only files).
const fileRefs = (value: unknown, found = new Set<string>()): Set<string> => {
  if (Array.isArray(value)) value.forEach((v) => fileRefs(v, found));
  else if (value && typeof value === "object") {
    const obj = value as { _type?: string; asset?: { _ref?: string } };
    if (obj._type === "file" && obj.asset?._ref) found.add(obj.asset._ref);
    Object.values(obj).forEach((v) => fileRefs(v, found));
  }
  return found;
};

// The file assets the site uses right now (published + draft).
const usedAssets = async () => {
  const docs = await query<SiteDoc[]>(`*[_id in ["site", "drafts.site"]]{ _id, _rev, showreel, categories }`);
  const ids = [...new Set(docs.flatMap((d) => [...fileRefs(d)]))];
  return query<Asset[]>(`*[_id in $ids]{ _id, url, size, originalFilename, webOptimized, previewUrl }`, { ids });
};
const assets = await usedAssets();
const pending = assets.filter((a) => !a.webOptimized);
const previewsPending = assets.filter((a) => !a.previewUrl).length;

if (check) {
  console.log(`${pending.length} video(s) to web-size, ${previewsPending} preview(s) to make`);
  const total = pending.length + previewsPending;
  if (process.env.GITHUB_OUTPUT) await import("node:fs/promises").then((fs) => fs.appendFile(process.env.GITHUB_OUTPUT!, `pending=${total}\n`));
  process.exit(0);
}
if (!pending.length && !previewsPending) {
  console.log("All videos are web-sized and have previews.");
  process.exit(0);
}

const work = await mkdtemp(join(tmpdir(), "compress-videos-"));
let failed = 0;
try {
  for (const asset of pending) {
    const name = asset.originalFilename ?? asset._id;
    console.log(`${name} (${mb(asset.size)})`);
    if (dryRun) continue;
    try {
      const input = join(work, "in");
      const res = await fetch(asset.url);
      if (!res.ok || !res.body) throw new Error(`download failed: ${res.status}`);
      await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createWriteStream(input));

      const output = await compress(input, join(work, "out.mp4"));
      if (!output) {
        await mutate([{ patch: { id: asset._id, set: { webOptimized: true } } }]);
        continue;
      }

      const filename = `${name.replace(/\.[^.]+$/, "")}-1080p.mp4`;
      const uploaded = await sanity<{ document: { _id: string } }>(`/assets/files/${dataset}?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        headers: { "Content-Type": "video/mp4" },
        body: await readFile(output),
      });
      const newId = uploaded.document._id;

      // Point the site (published + draft) at the new file. ifRevisionID: if the owner saved in the meantime,
      // this fails and the next run tries again, instead of overwriting their edit.
      const swap = (v: unknown) => JSON.parse(JSON.stringify(v ?? null).replaceAll(`"${asset._id}"`, `"${newId}"`));
      const fresh = await query<SiteDoc[]>(`*[_id in ["site", "drafts.site"]]{ _id, _rev, showreel, categories }`);
      await mutate([
        { patch: { id: newId, set: { webOptimized: true, originalAsset: asset._id } } },
        ...fresh
          .filter((d) => fileRefs(d).has(asset._id))
          .map((d) => ({ patch: { id: d._id, ifRevisionID: d._rev, set: { showreel: swap(d.showreel), categories: swap(d.categories) } } })),
        { patch: { id: asset._id, set: { webOptimized: true } } },
      ]);
      console.log(`  done → ${filename}`);

      if (deleteOriginals) {
        await mutate([{ delete: { id: asset._id } }]).then(
          () => console.log("  original deleted"),
          (error) => console.log(`  couldn't delete the original yet: ${error.message}`),
        );
      }
    } catch (error) {
      failed++;
      console.error(`  failed: ${(error as Error).message}`);
    } finally {
      await rm(join(work, "in"), { force: true });
      await rm(join(work, "out.mp4"), { force: true });
    }
  }

  // Previews, for the files the site uses after the pass above (new web versions included).
  const needPreview = (dryRun ? assets : await usedAssets()).filter((a) => !a.previewUrl);
  for (const asset of needPreview) {
    const name = asset.originalFilename ?? asset._id;
    console.log(`preview: ${name}`);
    if (dryRun) continue;
    try {
      const input = join(work, "in");
      const res = await fetch(asset.url);
      if (!res.ok || !res.body) throw new Error(`download failed: ${res.status}`);
      await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createWriteStream(input));
      const output = join(work, "preview.mp4");
      await encodePreview(input, output, await probe(input));
      const filename = `${name.replace(/\.[^.]+$/, "").replace(/-1080p$/, "")}-preview.mp4`;
      const uploaded = await sanity<{ document: { _id: string; url: string } }>(`/assets/files/${dataset}?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        headers: { "Content-Type": "video/mp4" },
        body: await readFile(output),
      });
      await mutate([{ patch: { id: asset._id, set: { previewUrl: uploaded.document.url } } }]);
      console.log(`  ${mb(asset.size)} → ${mb((await stat(output)).size)}`);
    } catch (error) {
      failed++;
      console.error(`  failed: ${(error as Error).message}`);
    } finally {
      await rm(join(work, "in"), { force: true });
      await rm(join(work, "preview.mp4"), { force: true });
    }
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
if (dryRun) console.log(`Dry run: ${pending.length} video(s) to web-size, ${previewsPending} preview(s) to make.`);
if (failed) process.exit(1);
