// Accounts a test case creates for itself, through System administration → Users, when it changes the account
// (disables it, changes its type) and so can't use a shared persona.

import { expect } from '@playwright/test';
import { named } from './run.js';

/** a new account of this run, created by the administrator; a persona for signIn() */
export async function createUser(admin, what) {
  const username = named(what);
  const user = {
    key: username, username, fullName: username, mailAddress: `${username}@example.com`,
    password: () => 'e2e-password',
  };
  await admin.goto('admin/users/_newuser');
  await admin.locator('#userName').fill(user.username);
  await admin.locator('#password').fill(user.password());
  await admin.locator('#fullName').fill(user.fullName);
  await admin.locator('#mailAddress').fill(user.mailAddress);
  await admin.getByRole('button', { name: 'Create user' }).click();
  await expect(admin).toHaveURL(/admin\/users$/);
  return user;
}

/** changes an account on its edit page: { disabled, administrator }; the rest stays as it is */
export async function editUser(admin, user, { disabled, administrator }) {
  await admin.goto(`admin/users/${user.username}/_edituser`);
  if (disabled !== undefined) {
    await admin.locator('#removed').setChecked(disabled);
  }
  if (administrator !== undefined) {
    await admin.locator(administrator ? '#userType_Admin' : '#userType_Normal').check();
  }
  await admin.locator('#update').click();
  await expect(admin).toHaveURL(/admin\/users$/);
}
