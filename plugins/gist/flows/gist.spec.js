// gist:T-001 A user creates a snippet, comments on it and deletes it.

import { test, expect } from '@playwright/test';
import { personas } from '../../../lib/personas.js';
import { authFile } from '../../../lib/auth.js';
import { named } from '../../../lib/run.js';
import { requirePlugins } from '../../../lib/plugins.js';
import { action, clickAndConfirm, expectErrorPage, expectNoErrorPage } from '../../../lib/ui.js';

const { user } = personas;

test.describe('gist:T-001 a user creates a snippet, comments on it and deletes it', { tag: '@gist' }, () => {
  requirePlugins('gist');
  test.use({ storageState: authFile(user) });

  test('gist:T-001: create, comment, delete', async ({ page }) => {
    const content = `content of ${named('snippet')}`;
    await page.goto('gist');
    await page.getByRole('link', { name: 'New snippet' }).click();
    await page.locator('#description').fill(named('snippet'));
    await page.locator('#fileName-0').fill('snippet.txt');
    await page.locator('#editor-0').click();
    await page.keyboard.type(content);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/gist/${user.username}/[0-9a-f]+$`));
    const snippetUrl = page.url();
    await expect(page.getByText(content)).toBeVisible();

    const comment = named('comment');
    await page.locator('textarea[name=content]').fill(comment);
    await page.getByRole('button', { name: 'Comment', exact: true }).click();
    await expect(page.locator('.markdown-body', { hasText: comment })).toBeVisible();

    await clickAndConfirm(page, action(page, 'Delete'));
    await expectNoErrorPage(page);
    await page.goto(snippetUrl);
    await expectErrorPage(page);
  });
});
