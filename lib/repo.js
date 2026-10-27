// Repository pages used by several test cases.

import { expect } from '@playwright/test';
import { apiGetOk, branchNames } from './api.js';

export async function defaultBranch(persona, repoPath) {
  return (await apiGetOk(persona, `repos/${repoPath}`)).default_branch;
}

/** replaces the text of an Ace editor (file editor, wiki editor) by typing */
export async function typeInEditor(page, text) {
  await page.locator('#editor').click();
  await page.keyboard.press('Control+a');
  await page.keyboard.type(text);
}

/** edits a file on a branch in the web editor and commits directly to that branch */
export async function commitFileChange(page, repoPath, branch, file, text, message) {
  await page.goto(`${repoPath}/edit/${branch}/${file}`);
  await typeInEditor(page, text);
  await page.locator('#message').fill(message);
  await page.getByRole('button', { name: 'Commit changes' }).click();
  await expect(page).toHaveURL(new RegExp(`/blob/${branch}/${file}$`));
}

/** opens a pull request for a branch from the Branches page; returns its number */
export async function openPullRequest(page, repoPath, branch, title) {
  await page.goto(`${repoPath}/branches`);
  const row = page.locator('tr').filter({ has: page.getByRole('link', { name: branch, exact: true }) });
  await row.getByRole('link', { name: 'Create pull request' }).click();
  const check = page.locator('#check-conflict-button');
  if (await check.isVisible()) {
    await check.click();
  }
  await page.locator('#pull-request-form input[name=title]').fill(title);
  await page.locator('#submit-button').click();
  await expect(page).toHaveURL(/\/pull\/\d+$/);
  return Number(page.url().match(/\/pull\/(\d+)$/)[1]);
}

/** merges the pull request shown on the page with the default strategy */
export async function mergePullRequest(page) {
  const merge = page.locator('#merge-pull-request-button');
  await expect(merge).toBeEnabled({ timeout: 30_000 });
  await merge.click();
  await page.getByRole('button', { name: 'Confirm merge' }).click();
  await expect(page.getByText('Pull request successfully merged and closed')).toBeVisible();
}

/** creates a branch from the default branch with the branch dropdown of the repository page */
export async function createBranch(page, persona, repoPath, name) {
  await page.goto(repoPath);
  await page.locator('[data-toggle=dropdown]').filter({ hasText: 'branch:' }).click();
  await page.locator('#branch-control-input').pressSequentially(name);
  await page.locator('#create-branch').click();
  await page.waitForLoadState('load');
  await expect.poll(() => branchNames(persona, repoPath), { message: `branch ${name} created` }).toContain(name);
}
