import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { recipeSchema } from './lib/recipe-schema';

const recepten = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recepten' }),
  schema: recipeSchema,
});

export const collections = { recepten };
