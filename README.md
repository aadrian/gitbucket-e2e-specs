gitbucket-e2e-specs
===================

Use cases, test cases and their browser tests (Playwright) for [GitBucket](https://github.com/gitbucket/gitbucket)
and its four bundled plugins (`notifications`, `gist`, `emoji`, `pages`).

- `core/`, `plugins/<pluginId>/`: one folder per scope, each with `use-cases.md` (`<scope>:UC-...`),
  `test-cases.md` (`<scope>:T-...`) and the specs per stage (`setup/`, `smoke/`, ...).
- `docs/e2e-plan.md`: scope, IDs, and how use cases, test cases and tests fit together.

Status: skeleton. Account types, use cases and test cases are placeholders; the only tests sign in as root and
check that the instance answers.

Run
---

Needs Node 20+ and a running GitBucket that may be changed (a throwaway or test instance).

```bash
npm install
npx playwright install firefox           # once per Playwright version; chromium for E2E_BROWSER=chromium
export E2E_BASE_URL=http://localhost:8080/   # default; include the context path if there is one
npm run e2e                              # setup, then smoke
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

Results, traces, screenshots and videos: `results/`. Stored sessions: `.auth/`. Both git-ignored.

Layout
------

```
playwright.config.js   projects per stage (setup → smoke → ...) over all scopes, browser, target
lib/target.js          instance under test (env), refuses non-local hosts by default
lib/personas.js        test accounts: the single place for names, account types, memberships
lib/auth.js            sign in / out, stored session per persona
lib/api.js             REST API (api/v3) as a persona, to check results of UI steps
lib/plugins.js         installed plugins; skips a plugin's tests when it is missing
core/                  GitBucket itself: use cases, test cases, setup/, smoke/, ...
plugins/<pluginId>/    a bundled plugin: use cases, test cases, its stage folders
docs/e2e-plan.md       scope, IDs, structure
```

License
-------

Apache License 2.0, like GitBucket (`LICENSE`).
