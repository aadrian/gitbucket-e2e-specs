// core:T-220 A repository owner removes webhooks and deploy keys.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../lib/personas.js';
import { authFile } from '../../lib/auth.js';
import { apiGetOk } from '../../lib/api.js';
import { newSshPublicKey } from '../../lib/keys.js';
import { named } from '../../lib/run.js';
import { action, clickAndCancel, clickAndConfirm, expectNoErrorPage, expectFlash } from '../../lib/ui.js';
import { addWebhook, deleteInForm, deleteInList, editWithoutSaving, hookUrl, listEntry } from '../../lib/webhooks.js';

const { owner } = personas;
const repo = repoPath();

/** the repository's webhooks from the API, by URL: their events */
async function hooks() {
  const list = await apiGetOk(owner, `repos/${repo}/hooks`);
  return Object.fromEntries(list.map((hook) => [hook.config.url, [...hook.events].sort()]));
}

test.describe('core:T-220 a repository owner removes webhooks and deploy keys', { tag: '@core' }, () => {
  test.use({ storageState: authFile(owner) });

  test('core:T-220: webhooks, from the list and from the edit page', async ({ page }) => {
    const base = `${repo}/settings/hooks`;
    const list = new RegExp(`/${repo}/settings/hooks$`);
    const first = hookUrl(named('repo-1'));
    const second = hookUrl(named('repo-2'));
    await addWebhook(page, base, first);
    await addWebhook(page, base, second);
    const secondEvents = (await hooks())[second];
    expect(secondEvents).toBeTruthy();

    await clickAndCancel(page, deleteInList(page, first));
    expect(Object.keys(await hooks()), 'kept after cancel').toEqual(expect.arrayContaining([first, second]));
    await clickAndConfirm(page, deleteInList(page, first));
    await expectNoErrorPage(page);
    await expect(page).toHaveURL(list);
    await expectFlash(page, `Webhook ${first} deleted`);
    await expect(listEntry(page, first)).toHaveCount(0);
    const afterFirst = await hooks();
    expect(afterFirst[first], 'deleted').toBeUndefined();
    expect(afterFirst[second], 'the second one').toBeTruthy();

    await editWithoutSaving(page, second);
    await clickAndCancel(page, deleteInForm(page));
    expect((await hooks())[second], 'kept after cancel, nothing saved').toEqual(secondEvents);
    await clickAndConfirm(page, deleteInForm(page));
    await expectNoErrorPage(page);
    await expect(page).toHaveURL(list);
    await expectFlash(page, `Webhook ${second} deleted`);
    expect((await hooks())[second], 'deleted, not saved with the changes').toBeUndefined();
  });

  test('core:T-220: deploy key', async ({ page }) => {
    const title = named('deploy');
    // one <strong> title and one Delete per key, in the same order
    const list = page.locator('.panel-body').first();
    const entries = () => list.locator(':scope > strong');
    const entry = entries().filter({ hasText: new RegExp(`^${title}$`) });
    await page.goto(`${repo}/settings/deploykey`);
    await page.locator('#title').fill(title);
    await page.locator('#publicKey').fill(newSshPublicKey(title));
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(entry).toBeVisible();
    const others = (await entries().allInnerTexts()).filter((t) => t !== title);

    const index = (await entries().allInnerTexts()).indexOf(title);
    await clickAndConfirm(page, action(list, 'Delete').nth(index));
    await expectNoErrorPage(page);
    await expect(page).toHaveURL(new RegExp(`/${repo}/settings/deploykey$`));
    await expect(entry).toHaveCount(0);
    expect(await entries().allInnerTexts(), 'the other keys').toEqual(others);
  });
});
