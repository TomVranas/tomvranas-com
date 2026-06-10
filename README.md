# tomvranas.com

Deal-book style site for Tom Vranas — operating executive. Built with
[Astro](https://astro.build), edited (blog only) via
[Decap CMS](https://decapcms.org), hosted on Netlify.

> Design rule of thumb: this site is a confidential information memorandum,
> not a marketing site. When in doubt, remove decoration.

## Stack

- **Astro** (static output), content collections for the blog, plain CSS
  (design tokens live in `src/styles/global.css`)
- **Fonts** self-hosted via Fontsource: Archivo (display), Source Serif 4
  (body), IBM Plex Mono (data/tombstones). No Google Fonts runtime requests.
- **Decap CMS** at `/admin`, git-gateway backend, blog collection only
- **Netlify** hosting (build config in `netlify.toml`), `public/_redirects`
  preserves old Squarespace URLs

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
| `src/assets/photos/` | Site photography — replace the `placeholder-*.svg` files (see below) |
| `public/admin/` | Decap CMS |
| `public/_redirects` | Cloudflare redirect map from old Squarespace paths |
| `scripts/migrate-blog.mjs` | Squarespace → markdown blog migration |
| `scripts/generate-og.mjs` | OG image + favicon generation from design tokens |
| `MIGRATION_REPORT.md` | Blog migration status — **read this, migration is pending** |

## One-time setup

### 1. GitHub

The repo is `tomvranas/tomvranas-com`. Production deploys come from `main`:
every push to `main` triggers a Netlify build and goes live.

### 2. Netlify (hosting)

1. [app.netlify.com](https://app.netlify.com) → sign up with GitHub →
   **Add new site → Import an existing project** → pick this repo.
2. Build settings are read from `netlify.toml` — leave them as-is and
   **Deploy**.
3. You get a `*.netlify.app` URL — verify everything there before touching
   DNS.

### 3. Decap CMS auth (git-gateway)

The blog editor at `/admin` uses Decap's git-gateway backend, which the
same Netlify account provides — no second service needed:

1. Netlify dashboard → **Identity** → enable; set registration to
   **Invite only**; invite `tom@tomvranas.com`.
2. **Identity → Services → Git Gateway** → enable.
3. Visit `/admin` on the deployed site, accept the email invite, log in —
   it should load and show the **Blog** collection. That's the test.

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

### 7. Photos

Photos render as deal-book exhibits via `src/components/Figure.astro`:
hairline border, grayscale filter, IBM Plex Mono caption. Five slots exist,
each currently a `placeholder-*.svg` in `src/assets/photos/`:

| Slot | Page | Shape | File to replace |
| --- | --- | --- | --- |
| Headshot (formal) | Home, beside the intro | 4:5 portrait | `placeholder-headshot.svg` |
| Team photo | Work, under "Seats held" | 3:2 landscape | `placeholder-team.svg` |
| Action / all-hands | Work, in the case study | 3:2 landscape | `placeholder-action.svg` |
| Speaking / workshop | Advisory, after the intro | 3:2 landscape | `placeholder-speaking.svg` |
| Candid (off the clock) | Contact, beside the sign-off | 4:5 portrait | `placeholder-candid.svg` |

To fill a slot: drop the full-resolution original (JPG is fine — Astro
resizes at build time, the grayscale treatment is applied in CSS) in
`src/assets/photos/`, update the import in the page, write a real caption
(true place/company/year — captions are evidence, never invent them), and
remove the `pending` prop. Keep it to these five; photos are exhibits,
not decoration.

## Visibly highlighted placeholders

Every bracketed placeholder from the copy spec renders with a yellow
highlight so it can't ship unnoticed. Search the codebase for `<Ph>` and
`mark class="ph"` — they must all be resolved (real titles, years, numbers)
before DNS cutover. Case-study figures: only numbers defensible in a room
with Ryan.

## DNS cutover from Squarespace

Keep Squarespace live until the new site is verified.

1. Verify on the `tomvranas.netlify.app` URL: all five pages, every migrated
   post, `/admin`, and each redirect in `public/_redirects` (hit `/experience`,
   `/coachingpress`, `/blog`, `/blog-vranas/<old-post-slug>`, `/toms-world/x`).
2. Netlify dashboard → **Domain management** → **Add custom domain** → add
   `tomvranas.com` and `www.tomvranas.com`.
3. If DNS is at Squarespace, point it at Netlify: either set Netlify as the
   DNS provider (add the apex + `www` records Netlify shows you) or, at the
   current registrar, add the `A`/`CNAME` records Netlify lists for the
   custom domain.
4. Wait for the Let's Encrypt certificate to issue; confirm
   `https://tomvranas.com` serves the new site.
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
