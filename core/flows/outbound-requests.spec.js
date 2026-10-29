// core:T-260 to core:T-262 Where webhooks may connect, the webhook timeout, and unknown event names in the API.
// The test cases change the instance's outbound request settings and restore them afterwards. They need the
// outbound request changes of gitbucket/gitbucket#4170 and #4171 and skip themselves on older versions.

import { test, expect } from '@playwright/test';
import { apiAs, apiGetOk } from '../../lib/api.js';
import { pageAs } from '../../lib/auth.js';
import {
  applyChanges, openOutboundSettings, readOutboundSettings, requireOutboundRequestChanges, saveOutboundSettings,
  timeoutError, timeoutField,
} from '../../lib/outbound.js';
import { personas, repoPath } from '../../lib/personas.js';
import { startReceiver } from '../../lib/receiver.js';
import { named } from '../../lib/run.js';
import { hookUrl, showResponse, testWebhook } from '../../lib/webhooks.js';

const hooks = `${repoPath()}/settings/hooks`;

test.describe('core:T-260 to core:T-262 outbound requests', { tag: '@core' }, () => {
  requireOutboundRequestChanges();

  let admin;
  let owner;
  let saved;
  test.beforeAll(async ({ browser }) => {
    admin = await pageAs(browser, personas.root);
    owner = await pageAs(browser, personas.owner);
    saved = await readOutboundSettings(admin);
  });
  test.afterAll(async () => {
    if (saved) {
      await saveOutboundSettings(admin, saved);
    }
    await admin?.context().close();
    await owner?.context().close();
  });

  test('core:T-260 an administrator limits where webhooks may connect', async () => {
    const receiver = await startReceiver();
    try {
      // blocked: the test reports it, nothing arrives
      await saveOutboundSettings(admin, { block: true, whitelist: '' });
      const blocked = await testWebhook(owner, hooks, receiver.url);
      await expect(blocked.locator('#req-errors')).toHaveText(/ERROR\s*invalid url/);
      expect(receiver.requests, 'nothing sent').toHaveLength(0);

      // whitelisted: delivered
      await saveOutboundSettings(admin, { whitelist: '127.0.0.0/8' });
      const delivered = await testWebhook(owner, hooks, receiver.url);
      await showResponse(delivered);
      await expect(delivered.locator('#res-status')).toHaveText('200');
      expect(receiver.requests, 'one request').toHaveLength(1);
      expect(receiver.requests[0].headers['x-github-event']).toBe('push');
    } finally {
      await receiver.close();
    }
  });

  test('core:T-261 an administrator sets the webhook timeout', async () => {
    // not a number: refused, nothing saved
    await openOutboundSettings(admin);
    await timeoutField(admin).fill('abc');
    await applyChanges(admin).click();
    await expect(timeoutError(admin)).toHaveText('Webhook timeout must be a number.');
    expect((await readOutboundSettings(admin)).timeout).toBe(saved.timeout);

    // a receiver that never answers: the test reports the timeout after about 2 seconds
    await saveOutboundSettings(admin, { whitelist: '127.0.0.0/8', timeout: 2 });
    const silent = await startReceiver({ answer: false });
    try {
      const started = Date.now();
      const dialog = await testWebhook(owner, hooks, silent.url);
      await showResponse(dialog);
      await expect(dialog.locator('#res-errors')).toHaveText(/ERROR\s*timed out/);
      expect(Date.now() - started, 'reported before the default timeout of 10 s').toBeLessThan(10_000);
      expect(silent.requests, 'the request arrived').toHaveLength(1);
    } finally {
      await silent.close();
    }
  });

  test('core:T-262 the API refuses unknown webhook event names', async () => {
    const url = hookUrl(named('unknown-event'));
    const api = await apiAs(personas.owner);
    try {
      const response = await api.post(`repos/${repoPath()}/hooks`, {
        data: { config: { url, content_type: 'json' }, events: ['push', '*'] },
      });
      expect(response.status()).toBe(422);
      expect((await response.json()).message).toBe('Unknown webhook events: *');
    } finally {
      await api.dispose();
    }
    const listed = await apiGetOk(personas.owner, `repos/${repoPath()}/hooks`);
    expect(listed.map((hook) => hook.config.url), 'not created').not.toContain(url);
  });
});
