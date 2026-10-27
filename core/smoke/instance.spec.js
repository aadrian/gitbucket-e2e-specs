// The instance is up: sign-in page, a stored session, the API. Placeholder until the first test cases exist.

import { test, expect } from '@playwright/test';
import { personas } from '../../lib/personas.js';
import { authFile } from '../../lib/auth.js';
import { apiAs } from '../../lib/api.js';
import { installedPlugins } from '../../lib/plugins.js';

const { root } = personas;

test.describe('instance', { tag: '@core' }, () => {
  test('the sign-in page opens', async ({ page }) => {
    await page.goto('signin');
    await expect(page.locator('#userName')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test.describe('as root', () => {
    test.use({ storageState: authFile(root) });

    test('the stored session is signed in', async ({ page }) => {
      await page.goto('');
      await expect(page.locator('a[href$="/signout"]')).toBeAttached();
    });
  });

  test('the API knows root', async () => {
    const api = await apiAs(root);
    const response = await api.get('user');
    expect(response.ok(), `GET api/v3/user: HTTP ${response.status()}`).toBe(true);
    expect((await response.json()).login).toBe(root.username);
    await api.dispose();
  });

  test('the API lists the installed plugins', async () => {
    // the plugin tests rely on it; the list may be empty
    expect(Array.isArray(await installedPlugins())).toBe(true);
  });
});
