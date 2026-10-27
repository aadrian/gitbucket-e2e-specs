// Test accounts, their stored sessions and the shared group and repository, created the way an administrator and
// the users would. Idempotent: what exists is kept.

import { test, expect } from '@playwright/test';
import { personas, shared, repoPath } from '../../lib/personas.js';
import { pageAs, signInAndStore } from '../../lib/auth.js';
import { apiGet } from '../../lib/api.js';

test.describe.configure({ mode: 'serial' });

const { root, user, manager, owner, developer } = personas;
const accounts = [user, manager, owner, developer];

test.describe('accounts', { tag: '@core' }, () => {
  test('root signs in', async ({ page }) => {
    await signInAndStore(page, root);
  });

  for (const persona of accounts) {
    test(`root creates ${persona.username}`, async ({ browser }) => {
      test.skip((await apiGet(root, `users/${persona.username}`)).status === 200, 'exists');
      const page = await pageAs(browser, root);
      await page.goto('admin/users/_newuser');
      await page.locator('#userName').fill(persona.username);
      await page.locator('#password').fill(persona.password());
      await page.locator('#fullName').fill(persona.fullName);
      await page.locator('#mailAddress').fill(persona.mailAddress);
      await page.getByRole('button', { name: 'Create user' }).click();
      await expect(page).toHaveURL(/admin\/users$/);
      expect((await apiGet(root, `users/${persona.username}`)).status).toBe(200);
    });

    test(`${persona.username} signs in`, async ({ page }) => {
      await signInAndStore(page, persona);
    });
  }

  test(`${manager.username} creates the group ${shared.group}`, async ({ browser }) => {
    test.skip((await apiGet(root, `orgs/${shared.group}`)).status === 200, 'exists');
    const page = await pageAs(browser, manager);
    await page.goto('groups/new');
    await page.locator('#groupName').fill(shared.group);
    await page.locator('#description').fill('Shared group of the e2e tests');
    await page.getByRole('button', { name: 'Create group' }).click();
    await expect(page).toHaveURL(new RegExp(`/${shared.group}$`));
  });

  test(`${owner.username} creates the repository ${repoPath()}`, async ({ browser }) => {
    test.skip((await apiGet(root, `repos/${repoPath()}`)).status === 200, 'exists');
    const page = await pageAs(browser, owner);
    await page.goto('new');
    await page.locator('#name').fill(shared.repo.name);
    await page.locator('input[name=initOption][value=README]').check();
    await page.getByRole('button', { name: 'Create repository' }).click();
    // the repository is created in the background
    await expect.poll(async () => (await apiGet(owner, `repos/${repoPath()}/branches`)).status, { timeout: 30_000 })
      .toBe(200);
  });

  test(`${owner.username} adds ${developer.username} as a developer`, async ({ browser }) => {
    const permission = async () => (await apiGet(owner, `repos/${repoPath()}/collaborators/${developer.username}/permission`)).body?.permission;
    test.skip(await permission() === 'DEVELOPER', 'exists');
    const page = await pageAs(browser, owner);
    await page.goto(`${repoPath()}/settings/collaborators`);
    await page.locator('#userName-collaborator').fill(developer.username);
    await page.locator('#addCollaborator').click();
    const entry = page.locator('#collaborator-list li').filter({ hasText: developer.username });
    await entry.locator('label', { hasText: 'Developer' }).click();
    await page.getByRole('button', { name: 'Apply changes' }).click();
    await expect.poll(permission).toBe('DEVELOPER');
  });
});
