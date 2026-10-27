// core:T-210 A group manager deletes their group. core:T-211 An administrator deletes a group.
// "Delete group" sits inside the edit form: after cancel nothing is saved, after confirm the group is gone.

import { test, expect } from '@playwright/test';
import { personas } from '../../lib/personas.js';
import { pageAs } from '../../lib/auth.js';
import { apiGet } from '../../lib/api.js';
import { named } from '../../lib/run.js';
import { action, clickAndCancel, clickAndConfirm, expectErrorPage, expectNoErrorPage } from '../../lib/ui.js';

const { root, manager } = personas;
const description = 'Group of an e2e run';

async function createGroup(browser, name) {
  const page = await pageAs(browser, manager);
  await page.goto('groups/new');
  await page.locator('#groupName').fill(name);
  await page.locator('#description').fill(description);
  await page.getByRole('button', { name: 'Create group' }).click();
  await expect(page).toHaveURL(new RegExp(`/${name}$`));
  await page.context().close();
}

/** on the edit page: change the form, cancel Delete group (nothing saved), then confirm (gone) */
async function deleteFromEditForm(page, group) {
  const deleteButton = action(page, 'Delete group');
  await page.locator('#description').fill('changed, not saved');
  await clickAndCancel(page, deleteButton);
  await expect(page.getByRole('button', { name: 'Update group' }), 'still on the edit page').toBeVisible();
  const kept = await apiGet(root, `orgs/${group}`);
  expect(kept.status, 'kept after cancel').toBe(200);
  expect(kept.body.description, 'nothing saved').toBe(description);

  await clickAndConfirm(page, deleteButton);
  await expectNoErrorPage(page);
  expect((await apiGet(root, `orgs/${group}`)).status, 'deleted').toBe(404);
  await page.goto(group);
  await expectErrorPage(page);
}

test.describe('core:T-210 / core:T-211 deleting a group', { tag: '@core' }, () => {
  test('core:T-210: a group manager deletes their group', async ({ browser }) => {
    const group = named('group-m');
    await createGroup(browser, group);
    const page = await pageAs(browser, manager);
    await page.goto(group);
    await page.getByRole('link', { name: 'Edit group' }).click();
    await deleteFromEditForm(page, group);
  });

  test('core:T-211: an administrator deletes a group', async ({ browser }) => {
    const group = named('group-a');
    await createGroup(browser, group);
    const page = await pageAs(browser, root);
    await page.goto('admin/users');
    await page.locator('#includeGroups').check();
    await expect(page).toHaveURL(/includeGroups=true/);
    await page.locator('tr').filter({ hasText: group }).getByRole('link', { name: 'Edit' }).click();
    await deleteFromEditForm(page, group);
  });
});
