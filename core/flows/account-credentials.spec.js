// core:T-200 A user removes their credentials (SSH key, GPG key, personal access tokens).
// No confirm dialog on these pages today; a dialog the click opens is accepted.

import { test, expect } from '@playwright/test';
import { personas } from '../../lib/personas.js';
import { authFile } from '../../lib/auth.js';
import { apiStatusWithToken } from '../../lib/api.js';
import { newGpgPublicKey, newSshPublicKey } from '../../lib/keys.js';
import { named, runId } from '../../lib/run.js';
import { action, clickAndConfirm, expectNoErrorPage } from '../../lib/ui.js';

const { user } = personas;

// a key or token list: one <strong> title per entry and one Delete per entry, in the same order
const list = (page) => page.locator('.panel-body').first();
const titles = (page) => list(page).locator(':scope > strong').allInnerTexts();
const entry = (page, title) => list(page).locator(':scope > strong').filter({ hasText: new RegExp(`^${title}$`) });
const deleteOf = async (page, title) => action(list(page), 'Delete').nth((await titles(page)).indexOf(title));

async function addKey(page, title, publicKey) {
  await page.locator('#title').fill(title);
  await page.locator('#publicKey').fill(publicKey);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(entry(page, title)).toBeVisible();
}

async function deleteAndCheck(page, title, url) {
  const others = (await titles(page)).filter((t) => t !== title);
  await clickAndConfirm(page, await deleteOf(page, title));
  await expectNoErrorPage(page);
  await expect(page).toHaveURL(url);
  await expect(entry(page, title)).toHaveCount(0);
  expect(await titles(page), 'the other entries').toEqual(others);
}

test.describe('core:T-200 a user removes their credentials', { tag: '@core' }, () => {
  test.use({ storageState: authFile(user) });

  test('core:T-200: SSH key', async ({ page }) => {
    const title = named('ssh');
    await page.goto(`${user.username}/_ssh`);
    await addKey(page, title, newSshPublicKey(title));
    await deleteAndCheck(page, title, new RegExp(`/${user.username}/_ssh$`));
  });

  test('core:T-200: GPG key', async ({ page }) => {
    const title = named('gpg');
    await page.goto(`${user.username}/_gpg`);
    await addKey(page, title, newGpgPublicKey(title, `${runId()}@example.com`));
    await deleteAndCheck(page, title, new RegExp(`/${user.username}/_gpg$`));
  });

  test('core:T-200: personal access tokens, just generated and from the list', async ({ page }) => {
    const generate = async (note) => {
      await page.goto(`${user.username}/_application`);
      await page.locator('#note').fill(note);
      await page.getByRole('button', { name: 'Generate token' }).click();
      const token = await page.locator('#generated-token').inputValue();
      expect(await apiStatusWithToken(token), 'the new token works').toBe(200);
      return token;
    };
    const application = new RegExp(`/${user.username}/_application$`);

    // the one-time view right after generating: its own Delete, above the list
    const first = await generate(named('token-1'));
    await clickAndConfirm(page, action(list(page), 'Delete').first());
    await expectNoErrorPage(page);
    await expect(page).toHaveURL(application);
    await expect(page.locator('#generated-token')).toHaveCount(0);
    await expect(entry(page, named('token-1'))).toHaveCount(0);
    expect(await apiStatusWithToken(first), 'the deleted token').toBe(401);

    // from the list
    const second = await generate(named('token-2'));
    await page.goto(`${user.username}/_application`);
    await expect(entry(page, named('token-2'))).toBeVisible();
    await deleteAndCheck(page, named('token-2'), application);
    expect(await apiStatusWithToken(second), 'the deleted token').toBe(401);
  });
});
