#!/usr/bin/env node
/**
 * Generates the branded default OG image and the favicon set, derived
 * entirely from the Part 1 design tokens. Outputs are committed, so this
 * only needs re-running if the tokens or wording change:
 *
 *   npm run generate-og
 *
 * - public/og-default.png      1200×630 — ink bg, name + role line in
 *                              Archivo, bottle-green rule
 * - public/favicon.svg         "TV" monogram (Archivo, converted to paths)
 * - public/favicon-32.png
 * - public/apple-touch-icon.png (180×180)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import wawoff2 from 'wawoff2';
import { Resvg } from '@resvg/resvg-js';
import opentype from 'opentype.js';

const INK = '#14181F';
const PAPER = '#FAFAF7';
const GREEN = '#1E4D3B';

// Fontsource ships woff2; resvg/opentype want ttf — decompress once.
const woff2 = await readFile(
  'node_modules/@fontsource/archivo/files/archivo-latin-600-normal.woff2'
);
const ttf = Buffer.from(await wawoff2.decompress(woff2));
const ttfPath = path.join(os.tmpdir(), 'archivo-600.ttf');
await writeFile(ttfPath, ttf);
const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));

const renderOptions = {
  font: { fontFiles: [ttfPath], loadSystemFonts: false, defaultFontFamily: 'Archivo' },
};

// ---- OG default image ----

const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${INK}"/>
  <text x="96" y="300" font-family="Archivo" font-weight="600" font-size="84"
        letter-spacing="-1.5" fill="${PAPER}">Tom Vranas</text>
  <rect x="100" y="348" width="120" height="4" fill="${GREEN}"/>
  <text x="96" y="432" font-family="Archivo" font-weight="600" font-size="40"
        letter-spacing="-0.5" fill="${PAPER}" opacity="0.85">Integration &amp; Operating Executive</text>
</svg>`;

await mkdir('public', { recursive: true });
await writeFile('public/og-default.png', new Resvg(ogSvg, renderOptions).render().asPng());
console.log('✓ public/og-default.png');

// ---- Favicon: "TV" monogram on ink ----
// Glyphs are converted to outline paths so the SVG favicon renders
// without the font installed.

const monogram = 'TV';
const size = 64;
const fontSize = 34;
const scale = fontSize / font.unitsPerEm;

// Per-glyph layout (font.getPath trips on Archivo's GSUB tables, and a
// two-letter monogram needs no shaping anyway).
const glyphs = monogram.split('').map((ch) => font.charToGlyph(ch));
const advance = glyphs.reduce((w, g) => w + g.advanceWidth * scale, 0);
let x = (size - advance) / 2;
const y = size / 2 + fontSize * 0.36; // optical vertical centering
const pathData = glyphs
  .map((g) => {
    const d = g.getPath(x, y, fontSize).toPathData(2);
    x += g.advanceWidth * scale;
    return d;
  })
  .join(' ');

const faviconSvg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  <path d="${pathData}" fill="${PAPER}"/>
</svg>`;

await writeFile('public/favicon.svg', faviconSvg);
console.log('✓ public/favicon.svg');

for (const [file, px] of [
  ['public/favicon-32.png', 32],
  ['public/apple-touch-icon.png', 180],
]) {
  const png = new Resvg(faviconSvg, {
    ...renderOptions,
    fitTo: { mode: 'width', value: px },
  })
    .render()
    .asPng();
  await writeFile(file, png);
  console.log(`✓ ${file}`);
}
