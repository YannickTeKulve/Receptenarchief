import { expect, test } from '@playwright/test';

test('archive searches, filters, and switches view', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Kies iets lekkers.' })).toBeVisible();
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(23);
  await expect(page.locator('.search-field .ph-magnifying-glass')).toBeVisible();
  await expect(page.locator('.archive-arrow .ph-arrow-up-right')).toHaveCount(23);
  await expect(page.locator('body')).not.toContainText('↗');

  await page.getByRole('searchbox', { name: 'Zoek in recepten' }).fill('alfredo');
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Pasta Alfredo met krokante kip en salade' })).toBeVisible();
  await expect(page).toHaveURL(/q=alfredo/);

  await page.getByRole('searchbox', { name: 'Zoek in recepten' }).fill('');
  await page.getByRole('button', { name: /Pasta 8/ }).click();
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(8);

  await page.getByRole('button', { name: 'Raster' }).click();
  await expect(page.locator('#archive-list')).toHaveAttribute('data-view', 'grid');
  await expect(page.getByRole('button', { name: 'Raster' })).toHaveAttribute('aria-pressed', 'true');
});

test('empty results can be cleared', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Zoek in recepten' }).fill('bestaat-niet');
  await expect(page.getByText('Geen recepten gevonden.')).toBeVisible();
  await page.getByRole('button', { name: 'Wis zoekopdracht en filters' }).click();
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(23);
});
