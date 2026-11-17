// core:T-270 A developer creates a label. core:T-271 A developer attaches a file to a comment.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../lib/personas.js';
import { authFile } from '../../lib/auth.js';
import { apiGetOk } from '../../lib/api.js';
import { named } from '../../lib/run.js';

const { developer } = personas;
const repo = repoPath();

/** a new issue; returns its number */
async function createIssue(page, title) {
  await page.goto(`${repo}/issues/new`);
  await page.locator('#issue-title').fill(title);
  await page.getByRole('button', { name: 'Submit new issue' }).click();
  await expect(page).toHaveURL(/\/issues\/\d+$/);
  return Number(page.url().match(/\/issues\/(\d+)$/)[1]);
}

test.describe('core:T-270 and core:T-271 issues', { tag: '@core' }, () => {
  test.use({ storageState: authFile(developer) });

  test('core:T-270 a developer creates a label', async ({ page }) => {
    const label = named('label');
    await page.goto(`${repo}/issues/labels`);
    await page.getByRole('link', { name: 'New label' }).click();
    await page.locator('#labelName-new').fill(label);
    await page.getByRole('button', { name: 'Create label' }).click();

    await expect(page.locator('a[id^="label-row-content-"]', { hasText: label })).toBeVisible();
    expect((await apiGetOk(developer, `repos/${repo}/labels`)).map((l) => l.name)).toContain(label);
  });

  test('core:T-271 a developer attaches a file to a comment', async ({ page }) => {
    const file = `${named('attachment')}.txt`;
    const content = `content of ${file}`;
    await createIssue(page, named('issue'));

    const chooser = page.waitForEvent('filechooser');
    await page.getByText('Attach images or documents by dragging & dropping, or selecting them.')
      .filter({ visible: true }).click();
    await (await chooser).setFiles({ name: file, mimeType: 'text/plain', buffer: Buffer.from(content) });
    const comment = page.locator('textarea[name=content]').filter({ visible: true });
    await expect(comment).toHaveValue(new RegExp(`\\[${file}\\]\\(.*/_attached/`));

    await page.getByRole('button', { name: 'Comment', exact: true }).filter({ visible: true }).first().click();
    const link = page.locator('.markdown-body').getByRole('link', { name: file });
    await expect(link).toBeVisible();
    const response = await page.request.get(await link.getAttribute('href'));
    expect(response.ok()).toBe(true);
    expect(await response.text()).toBe(content);
  });
});
