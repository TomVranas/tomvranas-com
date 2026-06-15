# tomvranas.com

Deal-book style site for Tom Vranas — operating executive. Built with
[Astro](https://astro.build) and hosted on
[Cloudflare Pages](https://pages.cloudflare.com). Blog posts are plain
markdown in `src/content/writing/` — edit them with Claude Code or any
editor and push; there is no separate CMS.

> Design rule of thumb: this site is a confidential information memorandum,
> not a marketing site. When in doubt, remove decoration.

## Stack

- **Astro** (`output: 'static'`), content collections for the blog, plain CSS
  (design tokens live in `src/styles/global.css`)
- **Fonts** self-hosted via Fontsource: Archivo (display), Source Serif 4
  (body), IBM Plex Mono (data/tombstones). No Google Fonts runtime requests.
- **Cloudflare Pages** hosting — auto-deploys on every push to `main`.
  `public/_redirects` preserves old Squarespace URLs; `public/_headers` is
  read if present.
- **Node 22.12.0** (required by Astro 6), pinned via `.nvmrc`,
  `.node-version`, and `package.json` `engines` so the build can't regress.

## Local development

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # outputs to dist/
npm run preview      # serve the built site
npm run migrate      # pull blog posts from the old Squarespace site (see below)
npm run generate-og  # regenerate og-default.png + favicons from tokens
```

## Repo layout

| Path | What it is |
| --- | --- |
| `src/pages/` | The five pages + 404 (`/`, `/work`, `/advisory`, `/writing`, `/contact`) |
| `src/content/writing/` | Blog posts (markdown, one file per post) |
| `src/config.ts` | **All site-wide settings: scheduling URL, analytics token, social URLs, email** |
| `src/styles/global.css` | Design tokens and every style on the site |
| `src/assets/logos/` | Drop ~8 clean grayscale client logos here (see below) |
| `src/assets/photos/` | Site photography |
| `public/_redirects` | Cloudflare Pages redirect map from old Squarespace paths |
| `scripts/migrate-blog.mjs` | Squarespace → markdown blog migration |
| `scripts/generate-og.mjs` | OG image + favicon generation from design tokens |
| `MIGRATION_REPORT.md` | Blog migration status |

## Hosting & deploys (Cloudflare Pages)

The repo is `TomVranas/tomvranas-com`. The site is connected to **Cloudflare
Pages**, production branch `main`:

- **Every push to `main` triggers a Cloudflare Pages build automatically and
  goes live.** There is no manual deploy step — do not run `wrangler deploy`
  or `npm run deploy`; just commit to `main`.
- Build settings (set in the Cloudflare Pages dashboard): build command
  `npm run build`, output directory `dist`, `NODE_VERSION=22.12.0`. The Node
  version is also pinned in the repo (`.nvmrc` / `.node-version` /
  `package.json` engines) so it stays consistent.
- Redirects and headers ship as static files in the build output:
  `public/_redirects` (and `public/_headers` if added) are copied to `dist/`
  and read by Pages.

## Editing the blog (no CMS)

Posts are markdown files in `src/content/writing/`, one per post.
Frontmatter fields (`src/content.config.ts`): `title`, `date`, `slug`
(optional URL override — defaults to the filename), `heroImage`, `excerpt`,
`tags`, `featured`. To add or edit a post, change the markdown and push to
`main`; Cloudflare rebuilds. Set `featured: true` to surface a post in the
"Selected" strip; `tags` drives the /writing filter (default view is
`essay`).

## Config values (`src/config.ts`)

- `analyticsToken` — Cloudflare dashboard → **Analytics & Logs → Web
  Analytics** → add site → copy the token. The beacon snippet is omitted
  automatically while the placeholder is in place. (Free, no cookie banner
  needed.)
- `linkedin` / `medium` / `goodreads` — verify the profile URLs are correct.

## Blog migration

If posts need to be (re)pulled from the old Squarespace site: `npm run
migrate` from a machine that can reach `tomvranas.com`, then commit the
generated posts, images, redirects, and the refreshed
`MIGRATION_REPORT.md`. Details in [MIGRATION_REPORT.md](MIGRATION_REPORT.md).

## Logos

Hand-pick ~8 strong logos, export clean files (SVG or transparent PNG,
real filenames like `everywhere-wireless.svg`), and drop them in
`src/assets/logos/`. The homepage logo row picks them up automatically,
renders them uniform-height grayscale (full color on hover), and the
placeholder boxes disappear. Do **not** reuse the old site's logo images —
many are screenshots.

## Photos

Photos render as deal-book exhibits via `src/components/Figure.astro`:
hairline border, duotone treatment (ink shadows, slight green cast), IBM
Plex Mono caption. Real photos live in `src/assets/photos/` and are imported
per page. Captions are evidence — true place/company/year, never invented.

## Visibly highlighted placeholders

Every bracketed placeholder from the copy spec renders with a yellow
highlight so it can't ship unnoticed. Search the codebase for `<Ph>` and
`mark class="ph"` — they must all be resolved before launch. Case-study
figures: only numbers defensible in a room with Ryan.

## DNS cutover from Squarespace

Keep Squarespace live until the new site is verified on the Cloudflare Pages
URL (`*.pages.dev`).

1. Verify on the Pages URL: all five pages, every migrated post, and each
   redirect in `public/_redirects` (hit `/experience`, `/coachingpress`,
   `/blog`, `/blog-vranas/<old-post-slug>`, `/toms-world/x`).
2. Cloudflare Pages → project → **Custom domains** → add `tomvranas.com` and
   `www.tomvranas.com`.
3. Point DNS at Cloudflare (if the domain is already on Cloudflare DNS, Pages
   wires the records automatically; otherwise add the `CNAME`/`A` records
   Pages shows you at the current registrar).
4. Wait for the certificate to issue; confirm `https://tomvranas.com` serves
   the new site.
5. Run Lighthouse against production (budget: ≥95 performance,
   ≥95 accessibility, ≥95 SEO on Home and one blog post):
   `npx lighthouse https://tomvranas.com --only-categories=performance,accessibility,seo`
6. Keep Squarespace active for one week of verified traffic, then cancel.

## Post-launch checklist

- [ ] All yellow placeholders gone (search `<Ph>` / `mark class="ph"`)
- [ ] Scheduling URL + analytics token set in `src/config.ts`
- [ ] Blog migrated; `MIGRATION_REPORT.md` shows zero unexplained failures
- [ ] Redirects spot-checked on the production domain
- [ ] Lighthouse ≥95 / ≥95 / ≥95 on `/` and one post
- [ ] Google Search Console: submit `https://tomvranas.com/sitemap-index.xml`
- [ ] Squarespace cancelled after one week of verified traffic

## Out of scope (by design — don't add)

No newsletter signup, no comments, no search, no dark mode, no animations,
no contact form (scheduling link + mailto only), no CMS.
