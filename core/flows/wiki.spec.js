// core:T-250 A wiki editor reverts and deletes wiki pages. Revert has no confirm dialog today.

import { test, expect } from '@playwright/test';
import { personas, repoPath } from '../../lib/personas.js';
import { authFile } from '../../lib/auth.js';
import { typeInEditor } from '../../lib/repo.js';
import { named } from '../../lib/run.js';
import { action, clickAndCancel, clickAndConfirm, expectNoErrorPage } from '../../lib/ui.js';

const { developer } = personas;
const repo = repoPath();
const wiki = `${repo}/wiki`;

async function savePage(page, url, pageName, text, message) {
  await page.goto(url);
  await page.locator('input[name=pageName]').fill(pageName);
  await typeInEditor(page, text);
  await page.locator('#message').fill(message);
  await page.locator('#commitButton').click();
  await expect(page).toHaveURL(new RegExp(`/wiki/${pageName}$`));
  await expect(page.locator('.markdown-body')).toContainText(text);
}

/** on a history page: compare the revision with `message` and the one before it, then Revert Changes */
async function revertRevision(page, message) {
  const rows = page.locator('tbody tr');
  const texts = await rows.allInnerTexts();
  const index = texts.findIndex((t) => t.includes(message));
  expect(index, `revision "${message}"`).toBeGreaterThanOrEqual(0);
  await rows.nth(index).getByRole('checkbox').check();
  await rows.nth(index + 1).getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Compare Revisions' }).click();
  await expect(page.getByRole('heading', { name: 'Compare Revisions' })).toBeVisible();
  await clickAndConfirm(page, action(page, 'Revert Changes'));
  await expectNoErrorPage(page);
}

const pageNames = async (page) => {
  await page.goto(`${wiki}/_pages`);
  return page.locator('.markdown-body li a, ul li a').allInnerTexts();
};

test.describe('core:T-250 a wiki editor reverts and deletes wiki pages', { tag: '@core' }, () => {
  test.use({ storageState: authFile(developer) });

  test('core:T-250: revert one page, revert across the wiki, delete a page', async ({ page }) => {
    const a = named('A');
    const b = named('B');
    await savePage(page, `${wiki}/_new`, a, `First text of ${a}`, `${a} created`);
    await savePage(page, `${wiki}/_new`, b, `First text of ${b}`, `${b} created`);
    await savePage(page, `${wiki}/${a}/_edit`, a, `Second text of ${a}`, `${a} edited`);
    await savePage(page, `${wiki}/${b}/_edit`, b, `Second text of ${b}`, `${b} edited`);

    // one page: its history
    await page.goto(`${wiki}/${a}/_history`);
    await revertRevision(page, `${a} edited`);
    await page.goto(`${wiki}/${a}`);
    await expect(page.locator('.markdown-body')).toContainText(`First text of ${a}`);

    // the whole wiki: its history, across B's edit only
    await page.goto(`${wiki}/_history`);
    await revertRevision(page, `${b} edited`);
    await page.goto(`${wiki}/${b}`);
    await expect(page.locator('.markdown-body')).toContainText(`First text of ${b}`);
    await page.goto(`${wiki}/${a}`);
    await expect(page.locator('.markdown-body'), 'A untouched').toContainText(`First text of ${a}`);

    // delete A from its edit page
    await page.goto(`${wiki}/${a}`);
    await page.getByRole('link', { name: 'Edit Page' }).click();
    const deletePage = action(page, 'Delete Page');
    await clickAndCancel(page, deletePage);
    expect(await pageNames(page), 'kept after cancel').toContain(a);
    await page.goto(`${wiki}/${a}/_edit`);
    await clickAndConfirm(page, deletePage);
    await expectNoErrorPage(page);
    const names = await pageNames(page);
    expect(names, 'deleted').not.toContain(a);
    expect(names, 'B still there').toContain(b);
  });
});
