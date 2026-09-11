import { z } from 'astro/zod';

export const recipeSchema = z.object({
  titel: z.string().trim().min(1),
  bron: z.url({ protocol: /^https?$/ }),
  porties: z.number().int().min(0).default(0),
  bereidingstijd_minuten: z.number().int().min(0).default(0),
  keuken: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),
  toegevoegd_op: z.preprocess(
    (value) => value instanceof Date ? value.toISOString().slice(0, 10) : value,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ),
  afbeelding: z.string().optional(),
});

export type RecipeData = z.infer<typeof recipeSchema>;
