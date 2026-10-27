// core:T-231 A developer deletes a pull request's branch after merging; a protected branch is refused.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../lib/personas.js';
import { authFile, pageAs } from '../../lib/auth.js';
import { apiGetOk, branchNames } from '../../lib/api.js';
import { commitFileChange, createBranch, mergePullRequest, openPullRequest } from '../../lib/repo.js';
import { named } from '../../lib/run.js';
import { action, clickAndCancel, clickAndConfirm, expectNoErrorPage, expectFlash } from '../../lib/ui.js';

const { developer, owner } = personas;
const repo = repoPath();

/** a branch with one commit, its pull request merged; leaves the page on the pull request */
async function mergedPullRequest(page, branch) {
  await createBranch(page, developer, repo, branch);
  await commitFileChange(page, repo, branch, 'README.md', `# ${branch}\n\nChanged on ${branch}.\n`, `Change on ${branch}`);
  const number = await openPullRequest(page, repo, branch, `Pull request from ${branch}`);
  await mergePullRequest(page);
  return number;
}

test.describe('core:T-231 a developer deletes a pull request branch after merging', { tag: '@core' }, () => {
  test.use({ storageState: authFile(developer) });

  test('core:T-231: Delete branch on the merged pull request', async ({ page }) => {
    const branch = named('pr');
    await mergedPullRequest(page, branch);
    const deleteBranch = action(page, 'Delete branch');

    await clickAndCancel(page, deleteBranch);
    expect(await branchNames(developer, repo), 'kept after cancel').toContain(branch);

    await clickAndConfirm(page, deleteBranch);
    await expectNoErrorPage(page);
    await expect(page).toHaveURL(/\/pull\/\d+$/);
    expect(await branchNames(developer, repo), 'deleted').not.toContain(branch);
    await expect(page.locator('.discussion-item-delete_branch')).toContainText(`deleted the ${branch} branch`);
  });

  test('core:T-231: a protected branch is not deleted', async ({ page, browser }) => {
    const branch = named('pr-protected');
    await mergedPullRequest(page, branch);

    // the owner protects the branch
    const ownerPage = await pageAs(browser, owner);
    await ownerPage.goto(`${repo}/settings/branches/${branch}`);
    await ownerPage.locator('input[name=enabled]').check();
    await ownerPage.getByRole('button', { name: 'Save changes' }).click();
    await expect(ownerPage.locator('#saved-info')).toBeVisible();
    expect((await apiGetOk(owner, `repos/${repo}/branches/${branch}/protection`)).enabled, 'protected').toBe(true);
    await ownerPage.context().close();

    await page.reload();
    await clickAndConfirm(page, action(page, 'Delete branch'));
    await expectNoErrorPage(page);
    await expectFlash(page, `branch ${branch} is protected.`);
    expect(await branchNames(developer, repo), 'kept').toContain(branch);
  });
});
