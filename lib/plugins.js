// Installed plugins (api/v3/gitbucket/plugins). A plugin's tests skip themselves when it isn't installed: an
// administrator can uninstall even the bundled ones.

import { test } from '@playwright/test';
import { apiAs } from './api.js';
import { personas } from './personas.js';

let installed;

/** ids of the installed plugins (pluginId), read once per worker */
export async function installedPlugins() {
  if (!installed) {
    const api = await apiAs(personas.root);
    const response = await api.get('gitbucket/plugins');
    if (!response.ok()) {
      throw new Error(`GET api/v3/gitbucket/plugins: HTTP ${response.status()}`);
    }
    installed = (await response.json()).map((plugin) => plugin.id);
    await api.dispose();
  }
  return installed;
}

/** in a describe block of a plugin's spec: skips its tests unless the plugin is installed */
export function requirePlugins(...pluginIds) {
  test.beforeAll(async () => {
    const ids = await installedPlugins();
    const missing = pluginIds.filter((id) => !ids.includes(id));
    test.skip(missing.length > 0, `not installed: ${missing.join(', ')}`);
  });
}
