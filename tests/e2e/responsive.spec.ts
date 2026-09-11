import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile-small', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`${viewport.name} has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const sizes = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
    await expect(page.getByRole('heading', { name: 'Kies iets lekkers.' })).toBeVisible();
  });
}

test('mobile uses intentional navigation and touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.archive-sidebar')).toBeHidden();
  await expect(page.locator('.mobile-masthead')).toBeVisible();
  for (const button of await page.locator('.mobile-categories button').all()) {
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('tablet landscape retains the archive sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await expect(page.locator('.archive-sidebar')).toBeVisible();
});

test('recipe becomes one column on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/recepten/pasta-alfredo-met-krokante-kip-en-salade/');
  const ingredients = await page.locator('.recipe-section--ingredients').boundingBox();
  const method = await page.locator('.recipe-section--method').boundingBox();
  expect(method?.y).toBeGreaterThan((ingredients?.y ?? 0) + (ingredients?.height ?? 0) - 2);
});
