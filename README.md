gitbucket-e2e-specs
===================

Use cases, test cases and their browser tests (Playwright) for [GitBucket](https://github.com/gitbucket/gitbucket)
and its four bundled plugins (`notifications`, `gist`, `emoji`, `pages`).

- `core/`, `plugins/<pluginId>/`: one folder per scope, each with `use-cases.md` (`<scope>:UC-...`),
  `test-cases.md` (`<scope>:T-...`) and the specs per stage (`setup/`, `smoke/`, ...).
- `docs/e2e-plan.md`: scope, IDs, and how use cases, test cases and tests fit together.

Status: started. Test accounts, setup and the first test cases (`core:T-200` to `core:T-250`: deleting and
reverting from GitBucket's pages); the plugin folders are placeholders.

Run
---

Needs Node 20+, the `gpg` command (core:T-200 makes a GPG key per run) and a running GitBucket that may be changed
(a throwaway or test instance).

```bash
npm install
npx playwright install firefox           # once per Playwright version; chromium for E2E_BROWSER=chromium
export E2E_BASE_URL=http://localhost:8080/   # default; include the context path if there is one
npm run e2e                              # setup, then smoke and flows
npx playwright test --project=flows      # the test cases (setup runs first)
npx playwright test --grep @gist         # one scope only (@core, @gist, ...)
npm run report                           # HTML report of the last run
```

| Variable | Default | Meaning |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:8080/` | instance under test |
| `E2E_ALLOW_REMOTE` | – | `1` allows a host other than localhost / `*.local` / `*.test` / `*.localhost` |
| `E2E_IGNORE_HTTPS_ERRORS` | – | `true` for self-signed or local CA certificates |
| `E2E_BROWSER` | `firefox` | `firefox` or `chromium` |
| `E2E_ROOT_PASSWORD` | `root` | password of `root` when it isn't the initial one |
| `E2E_PASSWORD` | `e2e-password` | password of the test accounts setup creates |
| `E2E_RUN` | new per run | run ID in the names of the data a run creates; set it to resume a run |

Results, traces, screenshots and videos: `results/`. Stored sessions: `.auth/`. Both git-ignored.

A throwaway instance from a GitBucket war (Java 17+), with an empty home:

```bash
scripts/start-gitbucket.sh gitbucket.war 8080 /tmp/gb-e2e-home   # waits until it answers; stop: kill "$(cat /tmp/gb-e2e-home.pid)"
```

The stored sessions in `.auth/` belong to one instance; setup writes them again at the start of every run.

CI
--

`.github/workflows/e2e.yml` runs the suite on every push and pull request, once in Firefox and once in Chromium, each
against a new GitBucket (release 4.48.0 by default; another release with "Run workflow"). On failure the HTML report
and the GitBucket log are uploaded as an artifact.

The jobs run in Playwright's Docker image (`mcr.microsoft.com/playwright:v<version>-noble`), which has the browsers
preinstalled. Its tag must match the `@playwright/test` version in `package.json`: when upgrading Playwright,
change both; the workflow fails with a message when they differ.

Locally with [act](https://github.com/nektos/act): `act push -j e2e --matrix browser:firefox`.

Layout
------

```
playwright.config.js   projects per stage (setup → smoke → ...) over all scopes, browser, target
lib/target.js          instance under test (env), refuses non-local hosts by default
lib/personas.js        test accounts: the single place for names, account types, memberships
lib/auth.js            sign in / out, stored session per persona
lib/api.js             REST API (api/v3) as a persona, to check results of UI steps
lib/plugins.js         installed plugins; skips a plugin's tests when it is missing
lib/run.js             run ID and names of a run's data
lib/ui.js              confirm dialogs (cancel / confirm), flash messages, error pages
lib/keys.js            fresh SSH and GPG public keys
lib/repo.js, webhooks.js   steps several test cases share (branches, editor, pull requests, webhooks)
scripts/start-gitbucket.sh throwaway instance from a war (local runs and CI)
.github/workflows/e2e.yml  CI: Firefox and Chromium against a new instance
core/                  GitBucket itself: use cases, test cases, setup/, smoke/, ...
plugins/<pluginId>/    a bundled plugin: use cases, test cases, its stage folders
docs/e2e-plan.md       scope, IDs, structure
```

License
-------

Apache License 2.0, like GitBucket (`LICENSE`).
