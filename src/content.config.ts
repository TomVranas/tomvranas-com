import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts. The glob loader uses a frontmatter `slug` field as the entry
// id when present, so migrated posts keep their original Squarespace slugs.
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    heroImage: z.string().optional(),
    excerpt: z.string().optional(),
    // Featured posts are the only ones listed on the /writing index. Every
    // post still builds at its own URL (preserving SEO + old redirects); the
    // index just stays restrained. Migrated archive posts default to false.
    featured: z.boolean().default(false),
  }),
});

export const collections = { writing };
