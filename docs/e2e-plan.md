E2E Test Plan
=============

This project describes how GitBucket is used, as use cases and test cases, and checks those test cases with browser
tests written with Playwright. The tests are meant to run before each release and, later, on pull requests.

Scope
-----

GitBucket itself (`core`) and the four plugins bundled with it: `notifications`, `gist`, `emoji` and `pages`.
An administrator can uninstall the bundled plugins, so the core tests don't rely on them, and a plugin's tests are
skipped when that plugin isn't installed (`lib/plugins.js`, from `api/v3/gitbucket/plugins`).

Each scope has its own folder with its use cases, test cases and specs:

```
core/                       use-cases.md, test-cases.md, setup/, smoke/, ...
plugins/<pluginId>/         use-cases.md, test-cases.md, and the same stage folders as needed
```

From use case to test
---------------------

Use cases describe what each kind of account can do. They don't depend on the tests and can be referenced from
issues as well.

Test cases describe end-to-end scenarios: who does what, in which order, what is expected after each step, and
which use cases are covered.

The Playwright test that implements a test case starts its title with the test case ID and carries its scope as a
tag, so the description, the spec file and the entry in the test report can be matched, and one scope can be run
on its own (`npx playwright test --grep @gist`).

IDs
---

Every ID starts with its scope: `core`, or the plugin's own `pluginId` as GitBucket reports it.

| What | Form | Examples |
|---|---|---|
| use case | `<scope>:UC-<type>-NNN` | `core:UC-U-001`, `gist:UC-U-001` |
| test case | `<scope>:T-NNN` | `core:T-001`, `pages:T-002` |
| tag of a test | `@<scope>` | `@core`, `@gist` |

`<type>` is a short letter code for the account type (defined with the use cases). Numbers count per scope.

A test case belongs to the scope whose behaviour it checks. One that needs a plugin is never a `core` test case;
it lists the plugins it needs under "Requires".

Use case entry:

```
- core:UC-U-001 <Account type> <does something>
  - details, edge cases, open questions
```

Test case entry:

```
### core:T-001 <Short title>
<What happens, in the words of the users involved; what is checked after each step.>

Use cases: core:UC-U-001, core:UC-U-002
Requires: core | <pluginId>, ...
Personas: ...
Spec: core/<stage>/<file>.spec.js
Status: planned | implemented | fails (issue)
```

Test projects
-------------

The specs are grouped into Playwright projects by stage. They run in this order and pick up the stage folder of
every scope (`core/<stage>/`, `plugins/<pluginId>/<stage>/`):

| Project | Status | Content |
|---|---|---|
| `setup` | started | test accounts and shared data, created once per instance |
| `smoke` | started | the instance answers, sign-in and API work |
| `access` | planned | each account type opens the pages it may open; the others are refused |
| `flows` | started | the test cases (`core:T-200` to `core:T-250`) |
| `release` | planned | the fixes and features of one release (`release/<version>.spec.js`) |
| `cleanup` | planned | removes the data a run created |

The tests share one GitBucket instance and run one after the other.

Test accounts
-------------

Test accounts are declared in `lib/personas.js`. They are created through GitBucket itself (registration, the
administration pages), once per instance, and reused by later runs; setup only creates what doesn't exist yet. The
account types follow from the use cases (`core/use-cases.md`).

| Persona | Account | Type | Created by |
|---|---|---|---|
| root | `root` | A | exists on every instance |
| user | `e2e-user` | U | root, System administration → Users |
| manager | `e2e-manager` | M | root; creates and manages the group `e2e-group` |
| owner | `e2e-owner` | O | root; creates the repository `e2e-owner/e2e-repo` with a README |
| developer | `e2e-developer` | D | root; the owner adds them to `e2e-repo` with the Developer role |

Test data
---------

Accounts and groups are kept between runs. Repositories, issues, pull requests and other data a test case changes
are created per run, with a run ID in their names, so a run can be resumed and its data removed afterwards.

Results are checked on the page and through GitBucket's REST API. The tests don't read the database, so they work
with every database GitBucket supports.

Test instances
--------------

The tests change data, so they run against a throwaway or test instance, set with `E2E_BASE_URL` (see README.md).
Hosts other than local ones have to be allowed explicitly with `E2E_ALLOW_REMOTE=1`.
