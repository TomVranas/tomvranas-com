# tomvranas.com

Deal-book style site for Tom Vranas — operating executive. Built with
[Astro](https://astro.build), edited (blog only) via
[Decap CMS](https://decapcms.org), hosted on Cloudflare Pages.

> Design rule of thumb: this site is a confidential information memorandum,
> not a marketing site. When in doubt, remove decoration.

## Stack

- **Astro** (static output), content collections for the blog, plain CSS
  (design tokens live in `src/styles/global.css`)
- **Fonts** self-hosted via Fontsource: Archivo (display), Source Serif 4
  (body), IBM Plex Mono (data/tombstones). No Google Fonts runtime requests.
- **Decap CMS** at `/admin`, git-gateway backend, blog collection only
- **Cloudflare Pages** hosting, `public/_redirects` preserves old
  Squarespace URLs

## Local development

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm run preview    # serve the built site
npm run migrate    # pull blog posts from the old Squarespace site (see below)
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
| `public/admin/` | Decap CMS |
| `public/_redirects` | Cloudflare redirect map from old Squarespace paths |
| `scripts/migrate-blog.mjs` | Squarespace → markdown blog migration |
| `scripts/generate-og.mjs` | OG image + favicon generation from design tokens |
| `MIGRATION_REPORT.md` | Blog migration status — **read this, migration is pending** |

## One-time setup

### 1. GitHub

The repo is `tomvranas/signature`. Production deploys come from `main`;
work on branches and merge.

### 2. Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to
   Git** → pick this repo.
2. Build settings: framework preset **Astro**, build command `npm run build`,
   output directory `dist`.
3. Deploy. You get a `*.pages.dev` preview URL — verify everything there
   before touching DNS.

### 3. Decap CMS auth (git-gateway)

Decap's git-gateway backend needs an identity/gateway service. The simplest
path that matches `public/admin/config.yml`:

1. Create a (free) Netlify site pointed at this repo — it's only used for
   Identity + Git Gateway, not hosting.
2. Netlify dashboard → **Identity** → enable; set registration to
   **Invite only**; invite `tom@tomvranas.com`.
3. **Identity → Services → Git Gateway** → enable.
4. Add the Netlify Identity widget snippet to `public/admin/index.html` if
   prompted by Decap docs for your setup.

Alternative (no Netlify): switch `backend` in `public/admin/config.yml` to
the `github` backend with an OAuth app proxied by a Cloudflare Worker —
see Decap's "External OAuth clients" docs. Either way, `/admin` should load
and show the **Blog** collection; that's the test.

### 4. Fill in config values (`src/config.ts`)

- `schedulingUrl` — replace `{{SCHEDULING_URL}}` with the real
  Calendly/SavvyCal URL. Until then the Contact page shows a highlighted
  warning next to the button.
- `analyticsToken` — Cloudflare dashboard → **Analytics & Logs → Web
  Analytics** → add site → copy the token. The beacon snippet is omitted
  automatically while the placeholder is in place. (Free, no cookie banner
  needed.)
- `linkedin` / `medium` / `goodreads` — verify the profile URLs are correct.

### 5. Blog migration (while Squarespace is still live)

The build environment couldn't reach `tomvranas.com` (network allowlist), so
migration is pending. From any normal machine: `npm run migrate`, then commit
the generated posts, images, redirects, and the refreshed
`MIGRATION_REPORT.md`. Details in [MIGRATION_REPORT.md](MIGRATION_REPORT.md).

### 6. Logos

Hand-pick ~8 strong logos, export clean files (SVG or transparent PNG,
real filenames like `everywhere-wireless.svg`), and drop them in
`src/assets/logos/`. The homepage logo row picks them up automatically,
renders them uniform-height grayscale, and the yellow placeholder disappears.
Do **not** reuse the old site's logo images — many are screenshots.

## Visibly highlighted placeholders

Every bracketed placeholder from the copy spec renders with a yellow
highlight so it can't ship unnoticed. Search the codebase for `<Ph>` and
`mark class="ph"` — they must all be resolved (real titles, years, numbers)
before DNS cutover. Case-study figures: only numbers defensible in a room
with Ryan.

## DNS cutover from Squarespace

Keep Squarespace live until the new site is verified.

1. Verify on the `*.pages.dev` URL: all five pages, every migrated post,
   `/admin`, and each redirect in `public/_redirects` (hit `/experience`,
   `/coachingpress`, `/blog`, `/blog/<old-post-slug>`, `/toms-world/x`).
2. Cloudflare Pages → **Custom domains** → add `tomvranas.com` and
   `www.tomvranas.com`.
3. If DNS is at Squarespace, move it: add the domain to Cloudflare (free
   plan), let it import records, then update nameservers at the registrar.
   Point the apex + `www` at the Pages project (Cloudflare wires this up
   when you add the custom domain).
4. Wait for certificates to issue; confirm `https://tomvranas.com` serves the
   new site.
5. Run Lighthouse against production (budget: ≥95 performance,
   ≥95 accessibility, ≥95 SEO on Home and one blog post):
   `npx lighthouse https://tomvranas.com --only-categories=performance,accessibility,seo`
6. Keep Squarespace active for one week of verified traffic, then cancel.

## Post-launch checklist

- [ ] All yellow placeholders gone (search `<Ph>` / `mark class="ph"`)
- [ ] Scheduling URL + analytics token set in `src/config.ts`
- [ ] Blog migrated; `MIGRATION_REPORT.md` shows zero unexplained failures
- [ ] Redirects spot-checked on production domain
- [ ] `/admin` login works; publish a test edit and confirm it deploys
- [ ] Lighthouse ≥95 / ≥95 / ≥95 on `/` and one post
- [ ] Google Search Console: submit `https://tomvranas.com/sitemap-index.xml`
- [ ] One professional photo added (candid-in-a-boardroom energy)
- [ ] Squarespace cancelled after one week of verified traffic

## Out of scope (by design — don't add)

No newsletter signup, no comments, no search, no dark mode, no animations,
no contact form (scheduling link + mailto only), no CMS for non-blog pages.
