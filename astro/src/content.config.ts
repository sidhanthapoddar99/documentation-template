import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Documentation collection - loads from external docs folder
const docs = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: '../docs',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    sidebar_position: z.number().optional(),
    sidebar_label: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { docs };
