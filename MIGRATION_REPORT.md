# Blog Migration Report

Status: **NOT YET RUN — blocked by build-environment network policy.**

## Summary

- Posts migrated: **0**
- Conversion failures: **0** (nothing attempted)
- Unexplained failures: **0** — the single blocker is fully explained below.

## What happened

The migration pipeline (`scripts/migrate-blog.mjs`, run via `npm run migrate`)
is built and committed, but the environment this site was built in sits behind
an outbound-network allowlist that does not include `tomvranas.com`:

```
$ curl https://tomvranas.com/blog?format=json
Host not in allowlist   (HTTP 403)
```

No request ever reached Squarespace, so no post data could be fetched.

## How to complete the migration

From any normal machine (laptop is fine), while the Squarespace site is still
live:

```sh
npm install
npm run migrate
```

The script will:

1. Fetch `https://tomvranas.com/blog?format=json`, paginating via the
   `offset` parameter until exhausted.
2. For each post, extract title, publish date, excerpt, body HTML, and hero
   image.
3. Convert the body HTML to markdown (headings, links, and images preserved)
   via Turndown.
4. Download every body image and hero image to
   `public/images/blog/[slug]/` and rewrite references to the local paths.
5. Write `src/content/writing/[slug].md` with frontmatter
   `title`, `date`, `slug` (original Squarespace slug preserved),
   `heroImage`, `excerpt`.
6. Append explicit per-post 301s to `public/_redirects` for any slug that had
   to change during sanitization (the wildcard `/blog/* → /writing/:splat`
   rule covers all preserved slugs).
7. Overwrite this file with the real report: post count, per-post failures,
   and the full old→new slug map.

Then commit the generated files and push.

### Note on image location

The spec suggested `/src/assets/blog/[slug]/`. Images intentionally land in
`public/images/blog/[slug]/` instead so the same folder works as Decap CMS's
`media_folder` and `heroImage` frontmatter paths resolve uniformly in both the
CMS preview and the built site. They are still fully local — nothing is
hotlinked from the Squarespace CDN.

## Current content

One sample post exists (`src/content/writing/pe-doesnt-fail-at-close.md`) —
the first new post named in the spec, with a yellow-highlighted placeholder
body. It verifies the pipeline end to end (collection schema, index listing,
post route, Decap editing) and must have its body written before launch.
