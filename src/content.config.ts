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
    // Optional tags for the /writing filter. When absent, the index derives a
    // best-guess tag from the title/excerpt; Tom refines by adding this field.
    tags: z.array(z.string()).optional(),
    // Featured posts surface in the "Selected" strip at the top of /writing.
    // Every post still builds at its own URL and appears in the full archive
    // ledger; featured just promotes it. Migrated archive posts default false.
    featured: z.boolean().default(false),
  }),
});

export const collections = { writing };
