// core:T-100 to core:T-102 Sign-in sessions: a new session at sign-in, and changes of an account that apply to its
// open sessions. They need the session changes of the pull request for gitbucket/gitbucket#4170 and #4171 and skip
// themselves on older versions (recognised like the outbound request test cases). The accounts they change are
// created by the test cases and disabled at the end.

import { test, expect } from '@playwright/test';
import { pageAs, signIn } from '../../lib/auth.js';
import { requireOutboundRequestChanges } from '../../lib/outbound.js';
import { personas } from '../../lib/personas.js';
import { createUser, editUser } from '../../lib/users.js';

const signedIn = (page) => page.locator('a[href$="/signout"]');
// "System administration" in the user menu (a collapsed dropdown)
const administrationMenu = (page) => page.locator('.dropdown-menu a[href$="/admin/users"]');
const sessionCookie = async (context) => (await context.cookies()).find((c) => c.name === 'JSESSIONID');

test.describe('core:T-100 to core:T-102 sign-in sessions', { tag: '@core' }, () => {
  requireOutboundRequestChanges();

  let admin;
  const created = [];
  test.beforeAll(async ({ browser }) => {
    admin = await pageAs(browser, personas.root);
  });
  test.afterAll(async () => {
    for (const user of created) {
      await editUser(admin, user, { disabled: true });
    }
    await admin?.context().close();
  });

  /** a new account, and a page in a browser context of its own */
  async function userWithPage(browser, what) {
    const user = await createUser(admin, what);
    created.push(user);
    const page = await (await browser.newContext()).newPage();
    return { user, page };
  }

  test('core:T-100 sign-in starts a new session', async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto('signin');
      const before = await sessionCookie(context);
      expect(before, 'a session before sign-in').toBeDefined();

      const signinResponse = page.waitForResponse((r) => r.url().endsWith('/signin') && r.request().method() === 'POST');
      await page.locator('#userName').fill(personas.user.username);
      await page.locator('#password').fill(personas.user.password());
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(signedIn(page)).toBeAttached();

      const after = await sessionCookie(context);
      expect(after.value, 'a new session ID').not.toBe(before.value);
      expect(after.httpOnly).toBe(true);
      expect(await (await signinResponse).headerValue('set-cookie')).toContain('SameSite=Lax');

      // the session ID from before sign-in is not signed in
      const old = await browser.newContext();
      try {
        await old.addCookies([{ ...before }]);
        const oldPage = await old.newPage();
        await oldPage.goto('');
        await expect(oldPage.getByRole('link', { name: 'Sign in' })).toBeVisible();
        await expect(signedIn(oldPage)).not.toBeAttached();
      } finally {
        await old.close();
      }
    } finally {
      await context.close();
    }
  });

  test('core:T-101 an administrator disables a signed-in user', async ({ browser }) => {
    const { user, page } = await userWithPage(browser, 'disabled');
    try {
      await signIn(page, user);

      await editUser(admin, user, { disabled: true });
      await page.goto('');
      await expect(signedIn(page), 'signed out').not.toBeAttached();
      await page.goto('new');
      await expect(page, 'creating a repository asks to sign in').toHaveURL(/signin/);
    } finally {
      await page.context().close();
    }
  });

  test('core:T-102 an administrator takes away a signed-in user\'s administrator rights', async ({ browser }) => {
    const { user, page } = await userWithPage(browser, 'admin');
    try {
      await editUser(admin, user, { administrator: true });
      await signIn(page, user);
      await page.goto('');
      await expect(administrationMenu(page)).toBeAttached();
      await page.goto('admin/users');
      await expect(page).toHaveURL(/admin\/users$/);

      await editUser(admin, user, { administrator: false });
      await page.goto('admin/users');
      await expect(page, 'the administration pages are refused').not.toHaveURL(/admin\/users$/);
      await expect(signedIn(page), 'still signed in').toBeAttached();
      await expect(administrationMenu(page)).not.toBeAttached();
    } finally {
      await page.context().close();
    }
  });
});
