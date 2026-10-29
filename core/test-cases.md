Test Cases: core
================

End-to-end scenarios of GitBucket itself; they pass with no plugin installed. IDs `core:T-NNN`, in the number
blocks of `use-cases.md`; ID scheme and format in `../docs/e2e-plan.md`.

The smoke tests (instance up, sign-in, API) are not test cases.

Sign-in sessions (core:T-100 to core:T-102)
-------------------------------------------

A new session at sign-in, and changes of an account that apply to its open sessions. These test cases need the
session changes of the pull request for gitbucket/gitbucket#4170 and #4171 (after 4.48.0) and skip themselves on
older versions. The accounts they change are created by them, with the run ID in the name, and disabled at the end.

### core:T-100 Sign-in starts a new session
A browser without a session opens the sign-in page and gets a session cookie. The user signs in: the browser now
has another session ID, the cookie is HttpOnly, and the sign-in response sets it with SameSite=Lax. A second browser
with the session cookie from before sign-in is not signed in.

Use cases: core:UC-U-100
Requires: core
Personas: a user (U)
Spec: core/flows/sessions.spec.js
Status: implemented

### core:T-101 An administrator disables a signed-in user
The administrator creates an account, and its user signs in in another browser. The administrator disables the
account: the user's next page shows them signed out, and creating a repository asks them to sign in.

Use cases: core:UC-A-101
Requires: core
Personas: administrator (A), an account created by the test
Spec: core/flows/sessions.spec.js
Status: implemented

### core:T-102 An administrator takes away a signed-in user's administrator rights
The administrator creates an account of type Administrator; its user signs in in another browser, has "System
administration" in the user menu and opens the user list. The administrator changes the account type to Normal: the
user's next request for the user list is refused, they are still signed in, and the menu entry is gone.

Use cases: core:UC-A-102
Requires: core
Personas: administrator (A), an account created by the test
Spec: core/flows/sessions.spec.js
Status: implemented

Deleting from a page (core:T-200 to core:T-250)
-----------------------------------------------

These test cases cover every page and confirm dialog from which GitBucket deletes or reverts something: account
credentials and webhooks, groups, repository webhooks and deploy keys, branches, milestones, wiki pages. Each one
checks the same things:

- Where a confirm dialog exists, it is dismissed first, and nothing has changed. Then the action is confirmed.
- Afterwards the object is gone (in the API where it has one, otherwise on the page), the page shown is the one
  GitBucket shows today (the list, with its message such as "Webhook … deleted"), and it isn't an error page.
- For a Delete button inside an edit form (webhook, group), the form is changed first and not saved: after Delete
  the object is gone and nothing of the form was saved.
- Where there is no confirm dialog today, a dialog that appears is accepted.
- The checks are about what the user sees and what the API returns, not about HTTP methods or URLs.

They run in Firefox and Chromium. Data has the run ID in its name; groups created by a test are deleted by it.

### core:T-200 A user removes their credentials
The user adds an SSH key, a GPG key and a personal access token on their account settings pages, then deletes
each one again. The token is deleted once right after it is generated (the one-time view) and once from the list
(a second token). After each delete the list no longer shows it, and the other entries are still there. A deleted
token no longer works for the API.

Use cases: core:UC-U-200, core:UC-U-201, core:UC-U-202
Requires: core
Personas: a user (U)
Spec: core/flows/account-credentials.spec.js
Status: implemented

### core:T-201 A user and a group manager delete account webhooks
The user adds two account webhooks. They delete the first from the list: cancel the dialog (still listed), then
confirm (gone, message shown, the second one still listed). They open the second one's edit page, change its
token and events without saving, and press Delete webhook: cancel (still on the edit page), then confirm; it is
gone and wasn't saved with the changes instead. A group manager does the same for a group's webhooks.

Use cases: core:UC-M-203
Requires: core
Personas: a user (U), a group manager (M)
Spec: core/flows/account-webhooks.spec.js
Status: implemented

### core:T-210 A group manager deletes their group
A group manager creates a group (no repositories), opens Edit group from the group's page, changes the
description without saving and presses Delete group: cancel (group still there, description unchanged), then
confirm. The group's page is gone and the API no longer returns the group.

Use cases: core:UC-M-210
Requires: core
Personas: a group manager (M)
Spec: core/flows/group-delete.spec.js
Status: implemented

### core:T-211 An administrator deletes a group
Same as core:T-210, from System administration → Users, with group accounts shown, → the group's Edit. The group
is created by the group manager.

Use cases: core:UC-A-211
Requires: core
Personas: administrator (A), a group manager (M)
Spec: core/flows/group-delete.spec.js
Status: implemented

### core:T-220 A repository owner removes webhooks and deploy keys
The owner adds two webhooks and a deploy key. Deletes the first webhook from the list (cancel, then confirm; the
API lists the second, not the first), then the second from its edit page after changing its token and events
without saving (cancel: the API shows its events unchanged; confirm: gone). Deletes the deploy key; the list no
longer shows it, the other keys are still there.

Use cases: core:UC-O-220, core:UC-O-221
Requires: core
Personas: a repository owner (O)
Spec: core/flows/repository-settings-delete.spec.js
Status: implemented

### core:T-230 A developer deletes a branch
A developer creates a branch with the branch menu of the repository page, opens Branches and presses Delete:
cancel (the API still lists it), then confirm (gone from the page and the API). The default branch has no Delete.

Use cases: core:UC-D-230
Requires: core
Personas: a developer collaborator (D)
Spec: core/flows/branches.spec.js
Status: implemented

### core:T-231 A developer deletes a pull request's branch after merging
A developer creates a branch, commits a change to it in the web editor, opens a pull request from the Branches
page and merges it. They press Delete branch: cancel (branch still there), then confirm. The branch is gone (API)
and the conversation shows the "deleted the branch" event. A second branch goes the same way up to the merge; the
owner then protects it, and Delete branch shows "branch … is protected." and the branch stays.

Use cases: core:UC-D-231
Requires: core
Personas: a developer collaborator (D), the repository owner (O) to protect the branch
Spec: core/flows/pull-request-branch.spec.js
Status: implemented

### core:T-240 A developer deletes milestones
A developer creates two milestones and an issue for each, with the milestone chosen on the new issue page. They
delete the first milestone from the list (cancel, then confirm) and the second from its own page (cancel, then
confirm). The API lists neither milestone; both issues show "No milestone" and have none in the API.

Use cases: core:UC-D-240
Requires: core
Personas: a developer collaborator (D)
Spec: core/flows/milestones.spec.js
Status: implemented

### core:T-250 A wiki editor reverts and deletes wiki pages
A wiki editor creates pages A and B and edits each once. From A's history they compare the two revisions and
press Revert Changes: A shows its first text again. From the wiki history they compare across B's edit and
revert: B shows its first text, A is unchanged. Then they open A → Edit Page → Delete Page: cancel (A still
listed in Pages), confirm (A no longer listed; B still there).

Use cases: core:UC-D-250, core:UC-D-251, core:UC-D-252
Requires: core
Personas: a developer collaborator (D)
Spec: core/flows/wiki.spec.js
Status: implemented

Outbound requests (core:T-260 to core:T-262)
--------------------------------------------

Where webhooks may connect, how long GitBucket waits for them, and webhook event names in the API. These test cases
need the outbound request changes of gitbucket/gitbucket#4170 and #4171 (after 4.48.0) and skip themselves on older
versions. They change the instance's outbound request settings and restore them at the end. A webhook receiver in
the test process on 127.0.0.1 stands for a server on a private network.

### core:T-260 An administrator limits where webhooks may connect
With blocking on and an empty IP whitelist, the repository owner presses Test Hook for a webhook to the local
receiver: the Request tab shows "ERROR invalid url", and nothing arrives. The administrator adds `127.0.0.0/8` to
the whitelist; the same test shows response status 200, and the receiver got one push event.

Use cases: core:UC-A-260, core:UC-O-222
Requires: core
Personas: administrator (A), a repository owner (O)
Spec: core/flows/outbound-requests.spec.js
Status: implemented

### core:T-261 An administrator sets the webhook timeout
The administrator enters `abc` as webhook timeout and applies: "Webhook timeout must be a number.", and the stored
value is unchanged. They set 2 seconds, with `127.0.0.0/8` in the whitelist. The owner tests a webhook to a
receiver that accepts the request and never answers: the Response tab shows "ERROR timed out" in less than 10
seconds, and the request did arrive.

Use cases: core:UC-A-261, core:UC-O-222
Requires: core
Personas: administrator (A), a repository owner (O)
Spec: core/flows/outbound-requests.spec.js
Status: implemented

### core:T-262 The API refuses unknown webhook event names
The owner creates a webhook through the API with the events `push` and `*`: the answer is 422 with the message
"Unknown webhook events: *", and the API doesn't list the webhook.

Use cases: core:UC-O-223
Requires: core
Personas: a repository owner (O)
Spec: core/flows/outbound-requests.spec.js
Status: implemented

Not covered here: sign-out (stays a link), and the gist plugin's own delete, which belongs to the plugin's test
cases.
