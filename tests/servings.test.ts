import { describe, expect, it } from 'vitest';
import { scaleIngredient } from '../src/lib/servings';

describe('scaleIngredient', () => {
  it('scales a leading whole number', () => {
    expect(scaleIngredient('2 uien, gesnipperd', 1.5)).toBe('3 uien, gesnipperd');
  });

  it('scales Dutch decimals and unicode fractions', () => {
    expect(scaleIngredient('1,5 el olijfolie', 2)).toBe('3 el olijfolie');
    expect(scaleIngredient('½ citroen', 2)).toBe('1 citroen');
    expect(scaleIngredient('1 ½ tl zout', 2)).toBe('3 tl zout');
  });

  it('scales ranges at both ends', () => {
    expect(scaleIngredient('3–4 el ketjap', 2)).toBe('6–8 el ketjap');
  });

  it('leaves ingredients without a leading quantity unchanged', () => {
    expect(scaleIngredient('zout en peper', 2)).toBe('zout en peper');
  });
});
