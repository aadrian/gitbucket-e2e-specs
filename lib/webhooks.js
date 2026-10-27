// Webhook list and edit form, the same for account, group and repository webhooks. `base` is the list page:
// `<account>/_hooks` or `<owner>/<repo>/settings/hooks`.

import { expect } from '@playwright/test';
import { action, clickable, expectFlash } from './ui.js';

export const hookUrl = (name) => `http://localhost:9/${name}`;

const event = (page, name) => page.getByRole('checkbox', { name: new RegExp(`^${name}\\b`) });

/** adds a webhook for push events through the "Add webhook" form */
export async function addWebhook(page, base, url) {
  await page.goto(base);
  await page.getByRole('link', { name: 'Add webhook' }).click();
  await page.locator('#url').fill(url);
  await event(page, 'Push').check();
  await page.getByRole('button', { name: 'Add webhook' }).click();
  await expectFlash(page, `Webhook ${url} created`);
  await expect(listEntry(page, url)).toBeVisible();
}

export const listEntry = (page, url) => page.locator('tr').filter({ hasText: url });

/** the delete button of a webhook in the list (an icon; only the account list labels it) */
export const deleteInList = (page, url) => clickable(listEntry(page, url).locator('.btn-danger'));

/** opens the webhook's edit page from the list and changes the form without saving it */
export async function editWithoutSaving(page, url) {
  await listEntry(page, url).locator('a.css-truncate').click();
  await expect(page.getByRole('button', { name: 'Update webhook' })).toBeVisible();
  await page.locator('#token').fill('unsaved-change');
  await event(page, 'Issues').check();
}

export const deleteInForm = (page) => action(page, 'Delete webhook');
