# Handoff: motion designer portfolio

## The real site (built 2026-09-30)
- Branch `feat/site-build`, **not committed yet**. `npm run dev`, or `npm run build && npx next start`.
- Content: everything editable is in `src/data/site.ts` (name, intro, bio, services, tools, showreel, categories → videos).
- Media: `public/videos/*.mp4` + `*.jpg` posters (placeholders rendered from the prototype canvas animations: Playwright frames → ffmpeg; showreel 18s cuts every 3s), `public/hero/plx-*.webp` (Osmo demo layers, replace per the layer brief).
- Components (`src/components`): Header, Hero (parallax + name→header morph + tools logos), Showreel (zoom parallax, GSAP), Works (tabs, 4:3 grid, IntersectionObserver play/pause), VideoModal (grow-from-tile player, keys, fullscreen), About, Contact (useActionState → `src/app/actions.ts`), SmoothScroll (Lenis on GSAP ticker), icons (Simple Icons paths).
- Contact form: server action + Nodemailer via Gmail app password; set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env.local` (template `.env.example`). Honeypot field `company`. Without env vars it shows "The form isn't connected yet…".
- Reduced motion: no Lenis, no parallax/morph, showreel becomes a plain 16:9 video (`src/lib/useReducedMotion.ts`).
- Verified: eslint + tsc clean, `next build` ok, Playwright e2e on 1280×800 and 390×844 (morph lands on header name, tabs, player open/next/Esc/focus return, form error state), no console errors, no horizontal scroll.
- **Dashboard (Sanity, built 2026-09-30):** Studio embedded at `/studio` (`sanity.config.ts`, schema `src/sanity/schema.ts`: one singleton doc `site` with tabs Profile / Showreel / Works / About me). Site reads it via `src/sanity/content.ts` (GROQ, `next.tags: ['site']`, revalidate 60 s; empty fields fall back to `src/data/site.ts`; no project id → whole site uses site.ts). Webhook `POST /api/revalidate` (`parseBody` + `SANITY_REVALIDATE_SECRET`, `revalidateTag('site','max')`). Seed: `node --env-file=.env.local scripts/seed-sanity.mts` (needs `SANITY_WRITE_TOKEN`). Durations are read from the video files client-side.
  - `package.json` overrides pin `@portabletext/editor` 8.2.2 + `plugin-dnd` 2.0.17 because editor 8.2.3's tarball 404'd on npm (2026-09-30); remove the overrides once it installs.
  - Setup still needed (owner's account): create project at sanity.io/manage → project id into `.env.local`; CORS origins (localhost + prod, allow credentials); Editor token → seed; invite the friend under Members; after deploy add webhook to `/api/revalidate`.
  - Verified: build ok, site unchanged with no project id, /studio shows setup note; with a dummy id the Studio loads to Sanity's login screen.
- **Deploy/responsive check (2026-09-30):** clean `npm ci` + `next build` from a fresh copy with no env vars passes. Responsive audit of the built site at 360, 390, 430, 844×390, 768, 1024×768, 1440: no horizontal scroll, no clipped text, no console errors, player fits the screen at every size. Phone fixes: header nav never wraps (smaller below 400px), player bottom padding.
- Hero tools row is now `ToolsMarquee` (Embla + AutoScroll, loop, speed 0.8, list ×3 so it never runs dry, edge fade mask; reduced motion = static draggable row). "Scroll ↓" label removed with it.
- Phones: header shows initials "M.O" (from the name). On scroll (`gsap.matchMedia` in Hero.tsx) the non-initial letters fade out and each initial flies to its header letter; the header dot appears on landing. A per-frame "gather + dot fade" version was tried and reverted (it lagged). Desktop keeps the full-name morph.
- **Live:** https://portfolio-cyan-ten-62.vercel.app (Vercel production domain, GitHub Sriram-MarksNMethods/portfolio, auto-deploys from main; per-deployment URLs like portfolio-acne-e2b4… stay behind Vercel Authentication, that is expected). Verified 2026-09-30: full QA suite clean on desktop/tablet/phone/reduced motion; env vars present (studio connected, webhook answers 401 Invalid signature = secret set). Sanity CORS for the live origin added and seed run (14 files + 14 images, doc `site`); live site serves all media from cdn.sanity.io, QA clean. First switch from fallback took ~2 revalidate cycles (Vercel data cache stale-while-revalidate). Pending: webhook → /api/revalidate, invite friend (Editor), delete the seed token.
- **Tools are editable (2026-09-30):** dashboard Tools = list of { name, optional logo upload (SVG/PNG, shown white via brightness-0 invert) }. Built-in Simple Icons logo used when the name matches one of the 7 (case-insensitive); otherwise a letter tile. `content.ts` accepts both the old plain-name shape and the new one; run `node --env-file=.env.local scripts/migrate-tools.mts` once (Editor token) to convert the seeded plain names. Works tabs: odd last tab spans both columns on phones.
- **2026-09-30 (later), uncommitted:** Services removed from About (still in the schema/data, not rendered). Contact → **Social links** in the dashboard (Contact tab, email moved there too): pick a network from 16 built-in logos (`src/data/socials.ts`, Simple Icons; LinkedIn from v10) or "Other" + name + optional logo; shown under the email as logo + name, opening in a new tab. **Hero tab**: 3 image slots (back / middle / front); uploading any one replaces all three demo layers. **Video compression**: `scripts/compress-videos.mts` (ffmpeg, no npm deps) re-encodes pending dashboard videos to H.264 MP4, long side ≤1920, CRF 21, maxrate 10M, faststart; swaps the refs in `site` + `drafts.site` (ifRevisionID), marks assets `webOptimized`; `--dry-run`, `--delete-originals`, `--local in out`. Runs in `.github/workflows/compress-videos.yml` (repository_dispatch `sanity-publish`, daily cron, manual). Setup: GitHub secrets SANITY_PROJECT_ID + SANITY_WRITE_TOKEN; Sanity webhook → `https://api.github.com/repos/Sriram-MarksNMethods/portfolio/dispatches`, POST, filter `_type == "site"`, projection `{"event_type": "sanity-publish"}`, headers `Authorization: Bearer <GitHub fine-grained PAT, Contents read/write>` + `Accept: application/vnd.github+json`. Local encode tested (4K→1080p, vertical ProRes→1080×1920); the Sanity part is untested (no write token locally).
- Sanity project: "Portfolio", id `lr55zhwh`, dataset `production` (in `.env.local`). Plan to deploy on a `*.vercel.app` URL: add that exact origin to Sanity CORS (credentials), copy env vars into Vercel, webhook → `/api/revalidate`.
- Next steps: connect Sanity project + seed; real name + videos + layers from the friend; Cloudflare Turnstile on the form; deploy.

Last updated: 2026-09-30 (prototype v18). Status: **Next.js site built (branch `feat/site-build`, uncommitted) from prototype v18.** Placeholder name/videos.

## What this is

A portfolio site for a friend who is a **video and motion graphics designer**.
The project is a fresh Next.js 16 + Tailwind v4 scaffold (`create-next-app`, one commit, untouched).
Read `AGENTS.md` first: this Next.js version has breaking changes, so check `node_modules/next/dist/docs/` before writing code.

## Where the design lives

- Live prototype (private artifact): https://claude.ai/artifact/GbXCSsxFjaScCpTWmAJ9ke (version 18)
- Local copy of the prototype source: `~/Personal_work/portfolio-design/portfolio-prototype.html` (moved out of the repo 2026-09-30)
  - It is a single HTML file with inline CSS/JS. Open it in a browser to click through.
  - Treat it as the visual and behaviour reference, not as code to port line by line.

## v8 home flow (2026-09-30)
Single scrolling home: parallax hero → **Showreel zoom parallax** (350vh section, sticky stage: reel canvas in the middle at 25vw×25vh surrounded by 6 project stills in the ZoomParallax layout; GSAP scrub scales layers ×4/5/6/5/6/8/9 over 70% of the scroll so the stills fly out and the reel lands exactly full screen, then caption + "Watch full reel" fade in and it holds; stills are clickable → project) → Selected work → **About section** → **Contact section** (email + Copy) → footer. Nav: Projects (page) / About / Contact (scroll to sections). The separate About page is gone. Static fallback (no GSAP / reduced motion): plain 16:9 reel.
Friend-provided layer images still needed — spec sent via `~/Personal_work/portfolio-design/hero-layer-brief.html` (artifact https://claude.ai/artifact/U9Y4BrQy2k6uXbqJixqWt9): 3 aligned 2400² WebP layers (sky / mid / front+figure), figure centred with head at 38–44%, horizon 62–70%, name band 43–57% (see chat: shoot or render layers, cut out with transparent PNG/WebP).

## v9 (2026-09-30)
- Projects page is **hidden, not deleted**: no nav link, project-page links to it carry `hidden`. Nav = About / Contact.
- Selected work CTA = "Want to see my work? Let's talk →" → scrolls to Contact (full portfolio is on request).
- Contact = email + Copy (left) and a form: Name / Email / Message / Send (right). Prototype form does nothing.
- Plan for the build: contact form via Next.js server action + Nodemailer (Gmail app password) or Resend free tier, with a honeypot + Cloudflare Turnstile; content editing for the non-technical friend via a headless CMS (Sanity Studio embedded at /studio recommended; Keystatic as the git-based alternative); videos hosted outside the repo.

## v11 (2026-09-30)
- Showreel section heading row removed (no "SHOWREEL", border, or "2025 · 00:18"): the zoom collage starts right after the hero.
- **Name → header morph**: the hero name no longer sinks behind the ground. Over the first 50% of the hero's scroll it scales/translates (GSAP scrub, power2.inOut, transform-origin 0 0) from its centred spot to the bar's name slot, staying in its layer so the figure passes in front. When it lands (progress > .995) body gets `name-docked`: hero name hidden, bar name shown. While flying, the bar name is hidden (`.morph.on-hero`). Bar name uses line-height .9 so both boxes scale 1:1. Intro text fades out over the first 25%.

## v14 (2026-09-30) — CURRENT STRUCTURE (supersedes the project-page notes below)
- One page only. **Projects page and project pages removed** (no styleframes/breakdown/credits pages, no hover-preview list, no page transitions, no "Let's talk" CTA).
- **My Works** section after the showreel zoom: tabs Logo animations / AI videos / Story reels / Others (2×2 grid of tabs on phones), grid of 4:3 video tiles (3 cols desktop, 2 tablet, 1 phone) that play muted loops; click → full-screen player that grows out of the tile (clip-path), with Play/Pause, scrub, timecode, Prev/Next (arrow keys), Fullscreen API button, Esc closes and returns focus to the tile. Showreel stills open the matching work.
- Header bigger: name 34px (27px phones), nav 14px mono "About me" / "Contact"; bar height 68px (58px phones). Bar is see-through over the hero, solid paper with an ink rule after it.
- v15: hero foot = tools only, real logos (Simple Icons CC0 paths, inlined, monochrome) + names, 30px, no heading; 2-column grid on phones. Services (line icons + names) live in About under the bio. All mono labels raised from 11px to 13px; header role 13px semibold; footer text ink instead of grey.
- Pending questions for user: About section heading still "About" (nav says "About me"); real category names/titles for tiles; hero name size on phones.

## v18 copy (approved 2026-09-30, first person)
- Header: name + nav only (role removed).
- Hero intro: "Logos, titles, reels and music videos. I make the still things move, frame by frame."
- Works heading: "Frame by frame".
- About me: "I'm Marcus, a motion designer and video editor. My job is the part people feel before they notice it: how a logo arrives, how long a title holds before the cut, where the frame changes on the beat." / "I take a project the whole way, from styleframe to final render: concept, design, animation, edit and grade. I work with brands, studios and artists, and I'm open to freelance."
- Contact lead: "Got something that needs to move? Tell me what you're making and when it's due." Button "Send message". Footer "© 2026 Marcus Okafor".
- Friend should confirm the About voice; "Marcus" is still the placeholder name.

## Agreed direction (current version)

Look: brutalist print. Off-white paper `#efeee8`, ink `#0e0e0e`, red `#e2371b` used only for state.
Fonts: **Anton** (display, uppercase), **Instrument Sans** (body), **IBM Plex Mono** (small uppercase labels).
Thick black rules between sections, big condensed type, mono metadata.

### Home page, top to bottom
1. **Top bar**: name (left), role (centre), nav `Projects` / `About` (right). Sticky, `mix-blend-mode: difference`.
2. **Hero (v7)**: full-screen (100svh) parallax of 4 layers: sky, mountain, the name, ground with a standing figure (`public/hero/plx-*.webp`, 2000×1906, from an Osmo demo — licence check / replace before launch). The name is Anton on **one line, fitted to the full width**, centred vertically on the screen (v8) so it reads easily; the standing figure overlaps it (iPhone depth-wallpaper effect). On scroll, GSAP ScrollTrigger moves layers down by 70 / 55 / 40 / 10 yPercent (Lenis smooth scroll). Intro (role, availability, one-line bio) top-left; services + "Scroll ↓" along the bottom. The top bar is plain paper text while over the hero, difference blend elsewhere.
3. **Showreel section**: a **small** section heading ("SHOWREEL", same size as "SELECTED WORK"), then a full-width 16:9 video playing inline and muted on a loop. Below it: current project + timecode. "Watch full reel" opens a full-screen player.
4. **Selected work**: a compact list of **5 projects** (number, title, type, year). Hovering a row shows a small preview video that follows the cursor.
5. **"View all projects (06) →"** button, which goes to the Projects page.

### Projects page
Two-column grid of all projects: 16:9 thumbnail, title, number · type · year. Click opens the project page.

### Project page
Big title, then a meta row (Client / Role / Runtime / Year), then a full-width **video player** (play/pause, scrub bar, timecode HH:MM:SS:FF, spec line such as "00:30 · 16:9 · 4K · 25 fps"). After that:
- Brief (short statement)
- **Styleframes**: stills in an uneven 12-column grid, mixing 16:9 frames and 9:16 social cuts, with timecode captions. Click opens a viewer with prev/next and keyboard support.
- **Breakdown**: the same frame at 4 stages (Sketch → Wireframe → Flat colour → Final)
- **Credits** grid
- Giant **"Next project →"** link to the following project

### About page
Bio, services, tools, email with a Copy button.

### Transitions (keep these)
- **Open a project**: that project's video/cover grows from the cursor position to full screen, then slides up to reveal the new page (~560ms in, ~420ms out, ease-in-out cubic).
- **Nav pages** (Home / Projects / About): same grow-and-slide-up with a black title card showing the page name.
- Titles rise in (translateY + fade). The showreel uses hard cuts.
- Respect `prefers-reduced-motion` (skip the transitions).

## Decisions and feedback so far (don't repeat these mistakes)

- **No glitch effects anywhere.** No RGB split, tearing, letter scrambling or glitchy hovers. The user removed them explicitly. Transitions stay, but clean.
- The name hero is **one line, full width**, not stacked and not giant.
- The showreel heading is **small**, a normal section heading. Big overlapping type was rejected.
- Selected work titles should stay **compact** (about `clamp(30px, 5vw, 76px)`). The earlier huge list was "too big".
- Rejected earlier: gimmicky toy concepts (terminal, physics letters, desktop OS, particles, mini game) and the photographer-style concepts (contact sheet, projector). The user wants film-grade polish, not toys.
- Iterate in small steps and check in; the user has pushed back on several over-built rounds.

## Placeholders to replace (all fake right now)

- Name "Marcus Okafor" (**invented, ask for the real name**), `hello@example.com`, bio, services, tools
- 6 projects: Pulse, Night Shift, Orbit, Liquid, Signal / Noise, Paper Cuts. Clients, roles, runtimes and text are all invented.
- All "videos" and stills are generated canvas animations. Replace them with real MP4s (or Vimeo/Mux) and real stills.

## Needed from the friend before building

1. Real name and how it should appear in the hero
2. Showreel video file
3. 4–6 projects, each with: video, client, role, year, runtime, a 1–2 line brief, 4–8 styleframes, and optional process frames for the breakdown
4. Bio, services list, tools, contact email, social links

## Suggested build plan (when we resume)

1. Pages with the App Router: `/` (home), `/projects`, `/projects/[slug]`, `/about`. Project data in one typed file (`src/data/projects.ts`).
2. Tailwind utilities in JSX (user preference: simple, readable code a new dev can follow, no generic abstractions).
3. Fonts via `next/font/google` (Anton, Instrument Sans, IBM Plex Mono).
4. Video: `<video muted loop playsInline autoplay>` for the inline reel and hover previews (short, compressed preview clips), plus a custom-controls player on project pages.
5. Page transitions: a client-side overlay that animates the clicked project's cover from the cursor rect to full screen, then navigates and slides away. Consider the View Transitions API if the Next 16 docs support it.
6. Fitted name: measure and set the font size on mount and resize (or use an SVG `<text>` with `textLength`).
7. Verify with headless Playwright (desktop 1280×800 and mobile 390×844, no horizontal scroll, no console errors).
