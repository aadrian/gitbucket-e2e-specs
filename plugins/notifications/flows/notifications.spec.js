// notifications:T-001 A developer changes how they watch a repository.
// notifications:T-002 A user turns email notifications off.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../../lib/personas.js';
import { authFile } from '../../../lib/auth.js';
import { requirePlugins } from '../../../lib/plugins.js';
import { expectFlash } from '../../../lib/ui.js';

const { developer, user } = personas;

test.describe('notifications:T-001 a developer changes how they watch a repository', { tag: '@notifications' }, () => {
  requirePlugins('notifications');
  test.use({ storageState: authFile(developer) });

  const watchButton = (page) =>
    page.locator('div.btn-group', { has: page.locator('a.watch') }).locator('button.dropdown-toggle');

  async function choose(page, name) {
    await watchButton(page).click();
    await page.locator('a.watch', { has: page.locator('span.notification-label', { hasText: new RegExp(`^${name}$`) }) })
      .click();
    await expect(watchButton(page)).toHaveText(name);
  }

  test('notifications:T-001: the watch button', async ({ page }) => {
    await page.goto(repoPath());
    const before = (await watchButton(page).innerText()).trim();
    const other = before === 'Watching' ? 'Ignoring' : 'Watching';

    await choose(page, other);
    await page.reload();
    await expect(watchButton(page)).toHaveText(other);

    await choose(page, before);
    await page.reload();
    await expect(watchButton(page)).toHaveText(before);
  });
});

test.describe('notifications:T-002 a user turns email notifications off', { tag: '@notifications' }, () => {
  requirePlugins('notifications');
  test.use({ storageState: authFile(user) });

  async function save(page, disabled) {
    await page.goto(`${user.username}/_notifications`);
    await page.locator('#disable').setChecked(disabled);
    await page.getByRole('button', { name: 'Save' }).click();
    await expectFlash(page, 'Notification setting has been updated.');
    await page.reload();
    await expect(page.locator('#disable')).toBeChecked({ checked: disabled });
  }

  test('notifications:T-002: Account settings, Notifications', async ({ page }) => {
    await save(page, true);
    await save(page, false);
  });
});
