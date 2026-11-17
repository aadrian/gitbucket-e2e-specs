// core:T-100 to core:T-102 Sign-in sessions: a new session at sign-in, and changes of an account that apply to its
// open sessions. They need the session changes of the pull request for gitbucket/gitbucket#4170 and #4171 and skip
// themselves on older versions (recognised like the outbound request test cases). The accounts they change are
// created by the test cases and disabled at the end.

// core:T-103 and core:T-104 Forms and their session: GitBucket accepts a form only with the token of the session that
// showed it (CSRF check). They skip themselves on versions without the check.

import { test, expect } from '@playwright/test';
import { apiGetOk } from '../../lib/api.js';
import { pageAs, signIn } from '../../lib/auth.js';
import { requireCsrfCheck } from '../../lib/csrf.js';
import { requireOutboundRequestChanges } from '../../lib/outbound.js';
import { personas, repoPath } from '../../lib/personas.js';
import { named } from '../../lib/run.js';
import { target } from '../../lib/target.js';
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

test.describe('core:T-103 and core:T-104 forms and their session', { tag: '@core' }, () => {
  requireCsrfCheck();

  const { developer } = personas;
  const repo = repoPath();
  const reloadHint = 'Reload the page and try again';
  // the newest open issues of the shared repository
  const issueTitles = async () => (await apiGetOk(developer, `repos/${repo}/issues`)).map((i) => i.title);

  test('core:T-103 a form sent after its session ended asks to reload the page', async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await signIn(page, developer);
      const title = named('stale-form');
      await page.goto(`${repo}/issues/new`);
      await page.locator('#issue-title').fill(title);

      const other = await context.newPage();
      await other.goto('signout');
      await other.close();

      await page.getByRole('button', { name: 'Submit new issue' }).click();
      await expect(page.getByText(reloadHint)).toBeVisible();
      expect(await issueTitles(), 'no issue created').not.toContain(title);

      await signIn(page, developer);
      await page.goto(`${repo}/issues/new`);
      await page.locator('#issue-title').fill(title);
      await page.getByRole('button', { name: 'Submit new issue' }).click();
      await expect(page).toHaveURL(/\/issues\/\d+$/);
      expect(await issueTitles()).toContain(title);
    } finally {
      await context.close();
    }
  });

  test('core:T-104 a page of another site can\'t send a form in the user\'s name', async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await signIn(page, developer);
      const title = named('cross-site-form');

      // the other application: same host, the next port; served by the test, not by a server (low ports like 1 are
      // blocked by Firefox even for a served page)
      const base = new URL(target.baseURL);
      const port = Number(base.port || (base.protocol === 'https:' ? 443 : 80)) + 1;
      const otherSite = `${base.protocol}//${base.hostname}:${port}/`;
      const action = new URL(`${repo}/issues/new`, target.baseURL).href;
      await context.route(otherSite, (route) => route.fulfill({
        contentType: 'text/html',
        body: `<form method="post" action="${action}"><input type="hidden" name="title" value="${title}">
               <button>Show the offer</button></form>`,
      }));

      await page.goto(otherSite);
      const post = page.waitForResponse((r) => r.url() === action && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Show the offer' }).click();
      const response = await post;
      expect(await response.request().headerValue('cookie'), 'the browser sends the session cookie').toContain('JSESSIONID');
      expect(response.status()).toBe(403);
      expect(await issueTitles(), 'no issue created').not.toContain(title);
    } finally {
      await context.close();
    }
  });
});
