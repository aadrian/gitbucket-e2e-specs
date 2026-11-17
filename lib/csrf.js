// GitBucket's CSRF check (after 4.48.0): a form or Ajax request that relies on the session cookie needs the session's
// token. Pages of a signed-in user carry it in <meta name="csrf-token">.

import { test } from '@playwright/test';
import { pageAs } from './auth.js';
import { personas } from './personas.js';

/** In a describe block: skips its tests on GitBucket versions without the CSRF check (no csrf-token meta tag). */
export function requireCsrfCheck() {
  test.beforeAll(async ({ browser }) => {
    const page = await pageAs(browser, personas.root);
    await page.goto('');
    const present = (await page.locator('meta[name="csrf-token"]').count()) > 0;
    await page.context().close();
    test.skip(!present, 'needs the CSRF check (after 4.48.0)');
  });
}
