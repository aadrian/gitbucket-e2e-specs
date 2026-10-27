// core:T-201 A user and a group manager delete account webhooks: from the list and from the edit page.
// Account webhooks have no API: the results are read from the list page.

import { test, expect } from '@playwright/test';
import { personas, shared } from '../../lib/personas.js';
import { pageAs } from '../../lib/auth.js';
import { named } from '../../lib/run.js';
import { clickAndCancel, clickAndConfirm, expectNoErrorPage, expectFlash } from '../../lib/ui.js';
import { addWebhook, deleteInForm, deleteInList, editWithoutSaving, hookUrl, listEntry } from '../../lib/webhooks.js';

const cases = [
  { who: 'the user, own account', persona: personas.user, account: personas.user.username },
  { who: 'the group manager, group', persona: personas.manager, account: shared.group },
];

test.describe('core:T-201 a user and a group manager delete account webhooks', { tag: '@core' }, () => {
  for (const { who, persona, account } of cases) {
    test(`core:T-201: ${who}`, async ({ browser }) => {
      const page = await pageAs(browser, persona);
      const base = `${account}/_hooks`;
      const list = new RegExp(`/${account}/_hooks$`);
      const first = hookUrl(named(`${account}-1`));
      const second = hookUrl(named(`${account}-2`));
      await addWebhook(page, base, first);
      await addWebhook(page, base, second);

      // from the list: cancel keeps it, confirm deletes it
      await clickAndCancel(page, deleteInList(page, first));
      await page.goto(base);
      await expect(listEntry(page, first), 'kept after cancel').toBeVisible();
      await clickAndConfirm(page, deleteInList(page, first));
      await expectNoErrorPage(page);
      await expect(page).toHaveURL(list);
      await expectFlash(page, `Webhook ${first} deleted`);
      await expect(listEntry(page, first)).toHaveCount(0);
      await expect(listEntry(page, second)).toBeVisible();

      // from the edit page, with unsaved changes in the form
      await editWithoutSaving(page, second);
      await clickAndCancel(page, deleteInForm(page));
      await expect(page.getByRole('button', { name: 'Update webhook' }), 'still on the edit page').toBeVisible();
      await clickAndConfirm(page, deleteInForm(page));
      await expectNoErrorPage(page);
      await expect(page).toHaveURL(list);
      await expectFlash(page, `Webhook ${second} deleted`);
      // gone, and not saved with the changes instead
      await expect(listEntry(page, second)).toHaveCount(0);
    });
  }
});
