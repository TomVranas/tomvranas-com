#!/usr/bin/env node
/**
 * Squarespace → Astro blog migration for tomvranas.com.
 *
 * Fetches https://tomvranas.com/blog?format=json (paginating via `offset`
 * until exhausted), converts each post's HTML body to markdown, downloads
 * every image locally, writes one markdown file per post into
 * src/content/writing/, and emits MIGRATION_REPORT.md at the repo root.
 *
 * Run from a network that can reach tomvranas.com (the original build
 * environment could not — see MIGRATION_REPORT.md):
 *
 *   npm run migrate
 *
 * Re-running is safe: posts are overwritten in place from source data.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';

const SOURCE = 'https://tomvranas.com/blog-vranas';
const CONTENT_DIR = 'src/content/writing';
const IMAGE_DIR = 'public/images/blog'; // served at /images/blog/...
const REPORT = 'MIGRATION_REPORT.md';
const REDIRECTS = 'public/_redirects';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const failures = [];
const slugMap = []; // { old, new, changed }

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function fetchAllPosts() {
  const posts = [];
  let offset = null;
  for (;;) {
    const url = offset ? `${SOURCE}?format=json&offset=${offset}` : `${SOURCE}?format=json`;
    console.log(`Fetching ${url}`);
    const data = await fetchJson(url);
    posts.push(...(data.items ?? []));
    const next = data.pagination?.nextPageOffset;
    if (!data.pagination?.nextPage || next == null) break;
    offset = next;
  }
  return posts;
}

function slugFromUrl(fullUrl) {
  return fullUrl.replace(/\/$/, '').split('/').pop();
}

function sanitizeSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function imageFilename(url, index) {
  const base = path.basename(new URL(url).pathname).split('?')[0];
  const clean = base.replace(/[^a-zA-Z0-9._-]+/g, '-');
  return clean && /\.[a-zA-Z0-9]+$/.test(clean) ? clean : `image-${index}.jpg`;
}

async function downloadImage(url, slug, index) {
  // Squarespace serves originals when the size query param is dropped.
  const cleanUrl = url.split('?')[0];
  const filename = imageFilename(cleanUrl, index);
  const dir = path.join(IMAGE_DIR, slug);
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, filename);
  const res = await fetch(cleanUrl, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${cleanUrl}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return `/images/blog/${slug}/${filename}`;
}

function stripHtml(html) {
  return (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Squarespace leaks per-block CSS rules (e.g.
// `#block-3ac8… { --sqs-block-content-flex: 0; }`) into the body HTML; they
// survive HTML→markdown conversion as literal visible text. Strip those lines
// and collapse the blank lines they leave behind.
function cleanMarkdown(md) {
  return md
    .replace(/^#block-[0-9a-f]+\s*\{[^}]*\}\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

async function migratePost(item) {
  const originalSlug = slugFromUrl(item.fullUrl ?? item.urlId ?? '');
  const slug = sanitizeSlug(originalSlug);
  slugMap.push({ old: originalSlug, new: slug, changed: originalSlug !== slug });

  let html = item.body ?? '';

  // Download body images and rewrite references to local paths.
  const srcs = [...html.matchAll(/<img[^>]+(?:data-src|src)="([^"]+)"/g)].map((m) => m[1]);
  let i = 0;
  for (const src of new Set(srcs)) {
    if (!/^https?:/.test(src)) continue;
    try {
      const local = await downloadImage(src, slug, i++);
      html = html.replaceAll(src, local);
    } catch (err) {
      failures.push(`Image download failed for "${slug}": ${src} — ${err.message}`);
    }
  }

  let heroImage;
  if (item.assetUrl) {
    try {
      heroImage = await downloadImage(item.assetUrl, slug, 'hero');
    } catch (err) {
      failures.push(`Hero image failed for "${slug}": ${item.assetUrl} — ${err.message}`);
    }
  }

  const markdown = cleanMarkdown(turndown.turndown(html));
  const date = new Date(item.publishOn ?? item.addedOn).toISOString().slice(0, 10);
  const excerpt = stripHtml(item.excerpt);

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(item.title ?? slug)}`,
    `date: ${date}`,
    `slug: ${slug}`,
    ...(heroImage ? [`heroImage: ${JSON.stringify(heroImage)}`] : []),
    ...(excerpt ? [`excerpt: ${JSON.stringify(excerpt)}`] : []),
    '---',
    '',
  ].join('\n');

  await mkdir(CONTENT_DIR, { recursive: true });
  await writeFile(path.join(CONTENT_DIR, `${slug}.md`), frontmatter + markdown + '\n');
  console.log(`✓ ${slug}`);
}

async function appendChangedSlugRedirects() {
  const changed = slugMap.filter((s) => s.changed);
  if (changed.length === 0 || !existsSync(REDIRECTS)) return;
  const lines = changed.map((s) => `/blog-vranas/${s.old}    /writing/${s.new}    301`);
  const current = await readFile(REDIRECTS, 'utf8');
  const block = `\n# Per-post redirects for slugs changed during migration\n${lines.join('\n')}\n`;
  if (!current.includes(block)) await writeFile(REDIRECTS, current + block);
}

async function writeReport(posts) {
  const rows = slugMap
    .map((s) => `| \`${s.old}\` | \`${s.new}\` | ${s.changed ? '**changed**' : 'preserved'} |`)
    .join('\n');
  const failureList =
    failures.length === 0 ? '_None._' : failures.map((f) => `- ${f}`).join('\n');
  const report = `# Blog Migration Report

Generated: ${new Date().toISOString()}
Source: ${SOURCE}?format=json

## Summary

- Posts fetched: **${posts.length}**
- Posts written: **${slugMap.length}**
- Conversion/download failures: **${failures.length}**

## Failures

${failureList}

## Slug map (old Squarespace slug → new slug)

The wildcard rule \`/blog-vranas/* → /writing/:splat\` in \`public/_redirects\` covers
all preserved slugs. Changed slugs get explicit per-post 301s appended to
\`_redirects\` automatically by this script.

| Old | New | Status |
| --- | --- | --- |
${rows}
`;
  await writeFile(REPORT, report);
  console.log(`\nWrote ${REPORT} (${slugMap.length} posts, ${failures.length} failures)`);
}

const posts = await fetchAllPosts();
console.log(`Found ${posts.length} posts.\n`);
for (const item of posts) {
  try {
    await migratePost(item);
  } catch (err) {
    failures.push(`Post "${item.title ?? item.fullUrl}" failed entirely: ${err.message}`);
  }
}
await appendChangedSlugRedirects();
await writeReport(posts);
if (failures.length > 0) process.exitCode = 1;
