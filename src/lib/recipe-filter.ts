export type FilterableRecipe = {
  id: string;
  title: string;
  cuisine: string;
  tags: string[];
  time: number;
  searchText: string;
};

export type RecipeFilters = {
  query?: string;
  category?: string;
  maxTime?: number;
};

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('nl').trim();
}

export function filterRecipes<T extends FilterableRecipe>(recipes: T[], filters: RecipeFilters): T[] {
  const query = normalizeSearch(filters.query ?? '');
  const category = normalizeSearch(filters.category ?? 'alles');
  return recipes.filter((recipe) => {
    const haystack = normalizeSearch([
      recipe.title,
      recipe.cuisine,
      recipe.tags.join(' '),
      recipe.searchText,
    ].join(' '));
    const matchesQuery = !query || query.split(/\s+/).every((term) => haystack.includes(term));
    const tags = recipe.tags.map(normalizeSearch);
    const matchesCategory = !category || category === 'alles' || tags.includes(category);
    const matchesTime = !filters.maxTime || (recipe.time > 0 && recipe.time <= filters.maxTime);
    return matchesQuery && matchesCategory && matchesTime;
  });
}
