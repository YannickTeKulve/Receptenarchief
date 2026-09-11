import type { CollectionEntry } from 'astro:content';

export type RecipeEntry = CollectionEntry<'recepten'>;

export function markdownSection(body: string, heading: string): string {
  const expression = new RegExp(`^##\\s+${heading}\\s*$`, 'im');
  const match = expression.exec(body);
  if (!match) return '';
  const rest = body.slice(match.index + match[0].length);
  const next = rest.search(/^##\s+/m);
  return (next >= 0 ? rest.slice(0, next) : rest).trim();
}

export function markdownList(body: string, heading: string): string[] {
  return markdownSection(body, heading)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(?:[-*]|\d+\.)\s+/.test(line))
    .map((line) => line.replace(/^(?:[-*]|\d+\.)\s+/, '').replace(/[*_`]/g, '').trim());
}

export function categoriesFor(recipe: RecipeEntry): string[] {
  const tags = recipe.data.tags.map((tag) => tag.toLocaleLowerCase('nl'));
  const categories = new Set<string>();
  if (tags.includes('pasta')) categories.add('pasta');
  if (tags.some((tag) => ['oven', 'ovenschotel', 'traybake', 'ovengroenten'].includes(tag))) categories.add('oven');
  if (tags.some((tag) => ['vegetarisch', 'vegan'].includes(tag))) categories.add('vegetarisch');
  if (recipe.data.bereidingstijd_minuten > 0 && recipe.data.bereidingstijd_minuten <= 30 || tags.includes('snel')) categories.add('snel');
  return [...categories];
}

export function recipeBody(recipe: RecipeEntry): string {
  return (recipe as RecipeEntry & { body?: string }).body ?? '';
}
