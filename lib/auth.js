// Sign in / out and the stored session per persona (.auth/<key>.json, git-ignored).

import { expect } from '@playwright/test';

export const authFile = (persona) => `.auth/${persona.key}.json`;

export async function signIn(page, persona) {
  await page.goto('signout');
  await page.goto('signin');
  await page.locator('#userName').fill(persona.username);
  await page.locator('#password').fill(persona.password());
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('a[href$="/signout"]'), `sign-in of ${persona.username}`).toBeAttached();
}

/** signs in and stores the session for the projects that run as this persona */
export async function signInAndStore(page, persona) {
  await signIn(page, persona);
  await page.context().storageState({ path: authFile(persona) });
}
