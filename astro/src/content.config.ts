/**
 * Content Collection Configuration
 *
 * Defines collections for loading markdown/MDX content.
 * Supports both .md and .mdx files.
 *
 * Note: Collections must be defined statically at build time.
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Shared schema for documentation content
const docSchema = z.object({
  // Required
  title: z.string(),

  // SEO & Metadata
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  image: z.string().optional(),

  // Sidebar configuration
  sidebar_position: z.number().optional(),
  sidebar_label: z.string().optional(),

  // Content organization
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),

  // Publishing control
  draft: z.boolean().optional().default(false),
  published_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),

  // Page behavior
  hide_title: z.boolean().optional().default(false),
  hide_toc: z.boolean().optional().default(false),
  full_width: z.boolean().optional().default(false),
});

// Main documentation collection - loads from ../docs
const docs = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: '../docs',
  }),
  schema: docSchema,
});

// Blog collection - loads from ../data/blog
const blog = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: '../data/blog',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    published_at: z.coerce.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  docs,
  blog,
};
