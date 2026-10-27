// Helpers for GitBucket's pages: confirm dialogs, flash messages, error pages.

import { expect } from '@playwright/test';

/**
 * Clicks and dismisses the confirm dialog the click opens; fails when no dialog appears. Returns its message.
 */
export async function clickAndCancel(page, locator) {
  let message;
  const onDialog = async (dialog) => {
    message = dialog.message();
    await dialog.dismiss();
  };
  page.once('dialog', onDialog);
  await locator.click();
  page.off('dialog', onDialog);
  expect(message, 'a confirm dialog').toBeTruthy();
  return message;
}

/**
 * Clicks and accepts any dialog the click opens (there may be none), then waits for the page that follows: every
 * confirmed action here leads to another page (link or form today, a form after GET routes become POST).
 */
export async function clickAndConfirm(page, locator) {
  const onDialog = (dialog) => dialog.accept();
  page.on('dialog', onDialog);
  try {
    const navigated = page.waitForEvent('framenavigated', { predicate: (frame) => frame === page.mainFrame() });
    await locator.click();
    await navigated;
    await page.waitForLoadState('load');
  } finally {
    page.off('dialog', onDialog);
  }
}

/**
 * The control a user clicks for an action, as a link or a button with this name: several actions are links today
 * and may become buttons in small forms (state-changing GET routes moving to POST).
 */
export const action = (scope, name) => scope.getByRole('link', { name, exact: true })
  .or(scope.getByRole('button', { name, exact: true }));

/** the link or button itself, or the first one inside (an element that may become a form around a button) */
export const clickable = (locator) => locator.locator('xpath=descendant-or-self::*[self::a or self::button][1]');

/** GitBucket's error page (404, 500, ...) has the title "Error" */
export async function expectNoErrorPage(page) {
  await expect(page).not.toHaveTitle('Error');
}

export async function expectErrorPage(page, heading = 'Not Found') {
  await expect(page).toHaveTitle('Error');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
}

/** the visible flash message with this text, shown after a redirect (the pull request pages use .alert-error) */
export const flash = (page, text) => page.locator('.alert-info, .alert-danger, .alert-error, .alert-success')
  .filter({ visible: true, hasText: text });

export async function expectFlash(page, text) {
  await expect(flash(page, text), `message "${text}"`).toBeVisible();
}
