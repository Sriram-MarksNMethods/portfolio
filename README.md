# Portfolio

One-page portfolio for a motion designer: parallax hero, showreel zoom, works grid with a full-screen player, about and contact.
Next.js 16 · Tailwind CSS 4 · GSAP + Lenis · Embla · Sanity (dashboard at `/studio`) · Nodemailer.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in what you need (all optional)
npm run dev                  # http://localhost:3000
```

## Where things live

- Content: the Sanity dashboard at `/studio` when `NEXT_PUBLIC_SANITY_PROJECT_ID` is set, otherwise `src/data/site.ts`.
- Sections: `src/components/` (Header, Hero, Showreel, Works, VideoModal, About, Contact).
- Contact form: `src/app/actions.ts` (Gmail app password in `.env.local`).
- Fill the dashboard from `site.ts`: `node --env-file=.env.local scripts/seed-sanity.mts`.

See `HANDOFF.md` for the design decisions, setup steps and deployment notes.
