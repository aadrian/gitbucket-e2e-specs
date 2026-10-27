// GitBucket browser tests. Target and browser come from the environment, see README.md.
import { defineConfig, devices } from '@playwright/test';
import { target } from './lib/target.js';
import { newRunId } from './lib/run.js';

// one id per run, inherited by the workers (lib/run.js)
process.env.E2E_RUN ||= newRunId();

const browsers = { firefox: 'Desktop Firefox', chromium: 'Desktop Chrome' };
const browser = process.env.E2E_BROWSER || 'firefox';
if (!browsers[browser]) {
  throw new Error(`Unknown E2E_BROWSER '${browser}' (one of: ${Object.keys(browsers).join(', ')})`);
}

// a stage's specs in every scope: core/<stage>/ and plugins/<pluginId>/<stage>/
const stage = (name) => [`core/${name}/**/*.spec.js`, `plugins/*/${name}/**/*.spec.js`];

export default defineConfig({
  testDir: '.',
  outputDir: 'results/artifacts',
  reporter: [['list'], ['html', { outputFolder: 'results/report', open: 'never' }]],
  // the tests share one GitBucket instance and its data: one after the other
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices[browsers[browser]],
    baseURL: target.baseURL,
    ignoreHTTPSErrors: target.ignoreHTTPSErrors,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // one project per stage; the scope (core, a plugin) is the tag of each test (@core, @gist, ...)
  projects: [
    // accounts and data the other projects need; idempotent (skips what exists)
    { name: 'setup', testMatch: stage('setup') },
    // the instance is up and usable
    { name: 'smoke', testMatch: stage('smoke'), dependencies: ['setup'] },
    // the test cases
    { name: 'flows', testMatch: stage('flows'), dependencies: ['setup'] },
    // planned (docs/e2e-plan.md): access, release, cleanup
  ],
});
