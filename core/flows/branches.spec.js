// core:T-230 A developer deletes a branch on the Branches page.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../lib/personas.js';
import { authFile } from '../../lib/auth.js';
import { branchNames } from '../../lib/api.js';
import { createBranch, defaultBranch } from '../../lib/repo.js';
import { named } from '../../lib/run.js';
import { clickable, clickAndCancel, clickAndConfirm, expectNoErrorPage } from '../../lib/ui.js';

const { developer } = personas;
const repo = repoPath();

// the branch's trash icon on the Branches page (a link today, may become a form with a button)
const deleteMarker = (page, branch) => page.locator(`.delete-branch[data-name="${branch}"]`);
const deleteOf = (page, branch) => clickable(deleteMarker(page, branch));

test.describe('core:T-230 a developer deletes a branch', { tag: '@core' }, () => {
  test.use({ storageState: authFile(developer) });

  test('core:T-230: from the Branches page; the default branch has no Delete', async ({ page }) => {
    const branch = named('branch');
    await createBranch(page, developer, repo, branch);

    await page.goto(`${repo}/branches`);
    await clickAndCancel(page, deleteOf(page, branch));
    expect(await branchNames(developer, repo), 'kept after cancel').toContain(branch);

    await clickAndConfirm(page, deleteOf(page, branch));
    await expectNoErrorPage(page);
    expect(await branchNames(developer, repo), 'deleted').not.toContain(branch);
    await page.goto(`${repo}/branches`);
    await expect(page.getByRole('link', { name: branch, exact: true })).toHaveCount(0);
    await expect(deleteMarker(page, await defaultBranch(developer, repo))).toHaveCount(0);
  });
});
