// core:T-240 A developer deletes milestones, from the milestone list and from the milestone's page.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../lib/personas.js';
import { authFile } from '../../lib/auth.js';
import { apiGetOk } from '../../lib/api.js';
import { named } from '../../lib/run.js';
import { action, clickAndCancel, clickAndConfirm, expectNoErrorPage } from '../../lib/ui.js';

const { developer } = personas;
const repo = repoPath();

const milestoneTitles = async () => (await apiGetOk(developer, `repos/${repo}/milestones?state=all`)).map((m) => m.title);

async function createMilestone(page, title) {
  await page.goto(`${repo}/issues/milestones/new`);
  await page.locator('#title').fill(title);
  await page.getByRole('button', { name: 'Create milestone' }).click();
  await expect(page.locator('a.milestone-title', { hasText: title })).toBeVisible();
}

/** a new issue with the milestone chosen in the sidebar; returns its number */
async function createIssue(page, title, milestone) {
  await page.goto(`${repo}/issues/new`);
  await page.locator('#issue-title').fill(title);
  await page.locator('.btn-group', { has: page.locator('input[id^="milestone-"]') }).locator('button.dropdown-toggle').click();
  await page.locator(`a.milestone[data-title="${milestone}"]`).click();
  await page.getByRole('button', { name: 'Submit new issue' }).click();
  await expect(page).toHaveURL(/\/issues\/\d+$/);
  await expect(page.locator('#label-milestone')).toHaveText(milestone);
  return Number(page.url().match(/\/issues\/(\d+)$/)[1]);
}

async function expectNoMilestone(page, issue) {
  expect((await apiGetOk(developer, `repos/${repo}/issues/${issue}`)).milestone ?? null, `issue #${issue}`).toBeNull();
  await page.goto(`${repo}/issues/${issue}`);
  await expect(page.locator('#label-milestone')).toHaveText('No milestone');
}

test.describe('core:T-240 a developer deletes milestones', { tag: '@core' }, () => {
  test.use({ storageState: authFile(developer) });

  test('core:T-240: from the list and from the milestone page', async ({ page }) => {
    const first = named('milestone-1');
    const second = named('milestone-2');
    await createMilestone(page, first);
    await createMilestone(page, second);
    const firstIssue = await createIssue(page, named('issue-1'), first);
    const secondIssue = await createIssue(page, named('issue-2'), second);

    // from the list
    await page.goto(`${repo}/issues/milestones`);
    const inList = action(page.locator('tr').filter({ has: page.locator('a.milestone-title', { hasText: first }) }), 'Delete');
    await clickAndCancel(page, inList);
    expect(await milestoneTitles(), 'kept after cancel').toContain(first);
    await clickAndConfirm(page, inList);
    await expectNoErrorPage(page);
    expect(await milestoneTitles(), 'deleted').not.toContain(first);
    await expect(page.locator('a.milestone-title', { hasText: first })).toHaveCount(0);

    // from the milestone's own page
    await page.goto(`${repo}/issues/milestones`);
    await page.locator('a.milestone-title', { hasText: second }).click();
    const onPage = action(page, 'Delete');
    await clickAndCancel(page, onPage);
    expect(await milestoneTitles(), 'kept after cancel').toContain(second);
    await clickAndConfirm(page, onPage);
    await expectNoErrorPage(page);
    expect(await milestoneTitles(), 'deleted').not.toContain(second);

    await expectNoMilestone(page, firstIssue);
    await expectNoMilestone(page, secondIssue);
  });
});
