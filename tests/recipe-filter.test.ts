import { describe, expect, it } from 'vitest';
import { filterRecipes, normalizeSearch } from '../src/lib/recipe-filter';

const recipes = [
  { id: 'pasta', title: 'Romige paddenstoelenpasta', cuisine: 'Italiaans', tags: ['pasta', 'vegetarisch'], time: 30, searchText: 'champignons knoflook' },
  { id: 'traybake', title: 'Voedzame quesadilla-traybake', cuisine: 'Mexicaans', tags: ['oven', 'familie'], time: 55, searchText: 'paprika mais' },
];

describe('normalizeSearch', () => {
  it('normalizes casing and accents', () => {
    expect(normalizeSearch('Crème BRÛLÉE')).toBe('creme brulee');
  });
});

describe('filterRecipes', () => {
  it('searches title, cuisine, tags, and ingredient text', () => {
    expect(filterRecipes(recipes, { query: 'champignons' }).map((item) => item.id)).toEqual(['pasta']);
    expect(filterRecipes(recipes, { query: 'mexicaans' }).map((item) => item.id)).toEqual(['traybake']);
  });

  it('combines a category and maximum duration', () => {
    expect(filterRecipes(recipes, { category: 'vegetarisch', maxTime: 40 }).map((item) => item.id)).toEqual(['pasta']);
    expect(filterRecipes(recipes, { category: 'oven', maxTime: 40 })).toEqual([]);
  });
});
