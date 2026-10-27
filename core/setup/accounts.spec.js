// Test accounts and their stored sessions. Placeholder: only root, who exists on every instance.
// Later: the accounts of lib/personas.js, created the way a user would (registration, admin screens), idempotent.

import { test } from '@playwright/test';
import { personas } from '../../lib/personas.js';
import { signInAndStore } from '../../lib/auth.js';

test('root signs in', { tag: '@core' }, async ({ page }) => {
  await signInAndStore(page, personas.root);
});
