import { expect, test } from '@playwright/test';

test('recipe page contains cooking content and checkable ingredients', async ({ page }) => {
  await page.goto('/recepten/pasta-alfredo-met-krokante-kip-en-salade/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pasta Alfredo met krokante kip en salade');
  await expect(page.getByRole('heading', { name: 'Ingrediënten' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bereiding' })).toBeVisible();
  const checks = page.getByRole('checkbox');
  expect(await checks.count()).toBeGreaterThan(10);
  await checks.first().check();
  await expect(checks.first()).toBeChecked();

  const firstIngredient = page.locator('.ingredient-list label').first();
  const originalIngredient = await firstIngredient.textContent();
  await page.getByRole('button', { name: 'Eén portie toevoegen' }).click();
  await expect(page.getByRole('status', { name: 'Aantal porties' })).toHaveText('5 personen');
  await expect(firstIngredient).not.toHaveText(originalIngredient ?? '');

  await expect(page.getByRole('link', { name: /Bekijk het originele recept/ })).toHaveAttribute('href', /^https:\/\//);
  await expect(page.getByRole('link', { name: /Bekijk het originele recept/ }).locator('.ph-arrow-up-right')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('↗');
});

test('unknown servings are not displayed as zero', async ({ page }) => {
  await page.goto('/recepten/gnocchi-traybake-met-pesto-en-groenteballetjes/');
  await expect(page.getByText('0 personen')).toHaveCount(0);
});

test('recipe JSON-LD is valid and complete enough', async ({ page }) => {
  await page.goto('/recepten/pasta-alfredo-met-krokante-kip-en-salade/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? '{}');
  expect(data['@type']).toBe('Recipe');
  expect(data.recipeIngredient.length).toBeGreaterThan(10);
  expect(data.recipeInstructions.length).toBeGreaterThan(5);
});
