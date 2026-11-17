// pages:T-001 A repository owner changes the Pages source.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../../lib/personas.js';
import { authFile } from '../../../lib/auth.js';
import { requirePlugins } from '../../../lib/plugins.js';
import { expectFlash } from '../../../lib/ui.js';

const { owner } = personas;

test.describe('pages:T-001 a repository owner changes the Pages source', { tag: '@pages' }, () => {
  requirePlugins('pages');
  test.use({ storageState: authFile(owner) });

  const sources = (page) => page.locator('input[name=source]');

  async function apply(page, value) {
    await page.goto(`${repoPath()}/settings/pages`);
    await sources(page).and(page.locator(`[value="${value}"]`)).check();
    await page.getByRole('button', { name: 'Apply changes' }).click();
    await expectFlash(page, 'Pages source saved');
    await page.reload();
    await expect(sources(page).and(page.locator(`[value="${value}"]`))).toBeChecked();
  }

  test('pages:T-001: Settings, Pages, Apply changes', async ({ page }) => {
    await page.goto(`${repoPath()}/settings/pages`);
    const values = await sources(page).evaluateAll((inputs) => inputs.map((i) => i.value));
    const before = await sources(page).and(page.locator(':checked')).getAttribute('value');
    const other = values.find((v) => v !== before);

    await apply(page, other);
    await apply(page, before);
  });
});
