// core:T-280 A developer uploads a file to the repository, from the Upload files page.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../lib/personas.js';
import { authFile } from '../../lib/auth.js';
import { apiGetOk } from '../../lib/api.js';
import { named } from '../../lib/run.js';

const { developer } = personas;
const repo = repoPath();

test.describe('core:T-280 a developer uploads a file to the repository', { tag: '@core' }, () => {
  test.use({ storageState: authFile(developer) });

  test('core:T-280: Upload files and Commit changes', async ({ page }) => {
    const file = `${named('upload')}.txt`;
    const content = `content of ${file}`;
    await page.goto(repo);
    await page.getByTitle('Upload files').click();

    const chooser = page.waitForEvent('filechooser');
    await page.getByText('Drag files here to add them to your repository').click();
    await (await chooser).setFiles({ name: file, mimeType: 'text/plain', buffer: Buffer.from(content) });
    await expect(page.locator('#upload-files')).toContainText(file);
    await page.locator('input[name=message]').fill(`Upload ${file}`);
    await page.getByRole('button', { name: 'Commit changes' }).click();

    await expect(page).not.toHaveURL(/\/upload\//);
    await expect(page.getByRole('link', { name: file, exact: true })).toBeVisible();
    const stored = await apiGetOk(developer, `repos/${repo}/contents/${file}`);
    expect(Buffer.from(stored.content, 'base64').toString()).toBe(content);
  });
});
