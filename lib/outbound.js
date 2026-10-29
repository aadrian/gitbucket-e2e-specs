// The "Outbound requests" settings (System administration → System settings → Integrations): whether webhooks and
// clone from URL may connect to private addresses, the IP whitelist and the webhook timeout.

import { test, expect } from '@playwright/test';
import { pageAs } from './auth.js';
import { personas } from './personas.js';
import { expectFlash } from './ui.js';

const block = (page) => page.locator('#blockPrivateAddress');
const whitelist = (page) => page.locator('textarea[name="webhook.whitelist"]');
export const timeoutField = (page) => page.locator('#webhookTimeout');
export const timeoutError = (page) => page.locator('#error-webhook_timeout');
export const applyChanges = (page) => page.getByRole('button', { name: 'Apply changes' });

export async function openOutboundSettings(page) {
  await page.goto('admin/system');
  await page.locator('#settings-tab').getByRole('link', { name: 'Integrations' }).click();
  await expect(block(page)).toBeVisible();
}

/** the settings as the page shows them: { block, whitelist, timeout } */
export async function readOutboundSettings(page) {
  await openOutboundSettings(page);
  return {
    block: await block(page).isChecked(),
    whitelist: await whitelist(page).inputValue(),
    timeout: await timeoutField(page).inputValue(),
  };
}

/**
 * Changes the given settings and saves; the others stay as they are. The whitelist is only editable while blocking
 * is on, so it is filled first, with blocking on.
 */
export async function saveOutboundSettings(page, settings) {
  await openOutboundSettings(page);
  if (settings.whitelist !== undefined) {
    await block(page).check();
    await whitelist(page).fill(settings.whitelist);
  }
  if (settings.block !== undefined) {
    await block(page).setChecked(settings.block);
  }
  if (settings.timeout !== undefined) {
    await timeoutField(page).fill(String(settings.timeout));
  }
  await applyChanges(page).click();
  await expectFlash(page, 'System settings has been updated.');
}

/**
 * In a describe block: skips its tests on GitBucket versions before the outbound request changes
 * (gitbucket/gitbucket#4170, #4171), recognised by the webhook timeout setting they added.
 */
export function requireOutboundRequestChanges() {
  test.beforeAll(async ({ browser }) => {
    const page = await pageAs(browser, personas.root);
    await openOutboundSettings(page);
    const present = (await timeoutField(page).count()) > 0;
    await page.context().close();
    test.skip(!present, 'GitBucket without the webhook timeout setting (gitbucket/gitbucket#4171)');
  });
}
