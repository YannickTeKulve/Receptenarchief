const FRACTIONS: Record<string, number> = {
  '⅛': 1 / 8,
  '¼': 1 / 4,
  '⅓': 1 / 3,
  '⅜': 3 / 8,
  '½': 1 / 2,
  '⅝': 5 / 8,
  '⅔': 2 / 3,
  '¾': 3 / 4,
  '⅞': 7 / 8,
};

const fractionCharacters = Object.keys(FRACTIONS).join('');
const quantity = `(?:\\d+(?:[.,]\\d+)?(?:\\s*[${fractionCharacters}])?|[${fractionCharacters}])`;
const leadingQuantity = new RegExp(`^(\\s*(?:(?:ca\\.?|circa|ongeveer)\\s+)?)(` + quantity + `)(?:\\s*([–-])\\s*(` + quantity + `))?`, 'i');

function parseQuantity(value: string): number {
  const fraction = [...value].find((character) => character in FRACTIONS);
  const whole = value.replace(new RegExp(`[${fractionCharacters}]`), '').trim();
  return (whole ? Number(whole.replace(',', '.')) : 0) + (fraction ? FRACTIONS[fraction] : 0);
}

function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(rounded);
}

export function scaleIngredient(ingredient: string, factor: number): string {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return ingredient;
  const match = ingredient.match(leadingQuantity);
  if (!match) return ingredient;
  const [, prefix, first, separator, second] = match;
  const scaledFirst = formatQuantity(parseQuantity(first) * factor);
  const scaledRange = second ? `${separator}${formatQuantity(parseQuantity(second) * factor)}` : '';
  return `${prefix}${scaledFirst}${scaledRange}${ingredient.slice(match[0].length)}`;
}
