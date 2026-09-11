import { describe, expect, it } from 'vitest';
import { recipeSchema } from '../src/lib/recipe-schema';

const validRecipe = {
  titel: 'Pasta met tomaat',
  bron: 'https://example.com/recept',
  porties: 4,
  bereidingstijd_minuten: 30,
  keuken: 'Italiaans',
  tags: ['pasta'],
  toegevoegd_op: '2026-09-11',
};

describe('recipeSchema', () => {
  it('accepts a complete recipe', () => {
    expect(recipeSchema.parse(validRecipe).titel).toBe('Pasta met tomaat');
  });

  it.each(['titel', 'bron', 'toegevoegd_op'] as const)('rejects a missing %s', (key) => {
    const invalid = { ...validRecipe };
    delete invalid[key];
    expect(() => recipeSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid source URLs and negative numbers', () => {
    expect(() => recipeSchema.parse({ ...validRecipe, bron: 'not-a-url' })).toThrow();
    expect(() => recipeSchema.parse({ ...validRecipe, porties: -1 })).toThrow();
  });

  it('allows unknown servings and duration as zero', () => {
    expect(recipeSchema.parse({ ...validRecipe, porties: 0, bereidingstijd_minuten: 0 })).toMatchObject({
      porties: 0,
      bereidingstijd_minuten: 0,
    });
  });
});
