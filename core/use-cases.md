Use Cases: core
===============

What GitBucket itself lets each account type do, without any plugin. IDs `core:UC-<type>-NNN`; ID scheme and
format in `../docs/e2e-plan.md`.

Account types
-------------

| Letter | Account type | Notes |
|---|---|---|
| U | signed-in user, on their own account | |
| M | group manager | also the user themselves for their own account webhooks |
| A | administrator | can do everything the others can |
| O | repository owner | or a collaborator with the Admin role |
| D | developer collaborator | write access to the repository and its wiki |

More types follow with the use cases that need them.

Numbers
-------

Numbers below 200 are kept for accounts, sign-in, navigation and menus. From 200 on, each area has a block of ten,
so it can grow in place; test cases use the same blocks.

| Block | Area |
|---|---|
| 200-209 | account settings: credentials and account webhooks |
| 210-219 | groups |
| 220-229 | repository settings |
| 230-239 | branches |
| 240-249 | milestones |
| 250-259 | wiki |

Account settings
----------------

- core:UC-U-200 User deletes one of their SSH keys
  - Account settings → SSH Keys → Delete. No confirm dialog.
- core:UC-U-201 User deletes one of their GPG keys
  - Account settings → GPG Keys → Delete. No confirm dialog.
- core:UC-U-202 User revokes a personal access token
  - Account settings → Applications. Two places: the token just generated (shown once) and the token list.
- core:UC-M-203 User or group manager deletes an account webhook
  - From the webhook list (confirm dialog) and from the webhook's edit page (Delete webhook inside the edit form,
    confirm dialog). The same for a user's own webhooks and a group's webhooks.

Groups
------

- core:UC-M-210 Group manager deletes the group
  - Group profile → Edit group → Delete group, confirm dialog. The button sits inside the edit form.
- core:UC-A-211 Administrator deletes a group
  - System administration → Users (with group accounts) → the group's Edit → Delete group, confirm dialog. The
    button sits inside the edit form.

Repository settings
-------------------

- core:UC-O-220 Repository owner deletes a webhook
  - Settings → Webhooks: from the list (confirm dialog) and from the edit page (Delete webhook inside the edit form,
    confirm dialog).
- core:UC-O-221 Repository owner deletes a deploy key
  - Settings → Deploy keys → Delete. No confirm dialog.

Branches
--------

- core:UC-D-230 Developer deletes a branch
  - Branches page → Delete, confirm dialog. Not offered for the default branch.
- core:UC-D-231 Developer deletes the source branch of a merged pull request
  - Pull request page → Delete branch, confirm dialog. A protected branch is refused with a message. The
    conversation then shows a "deleted the branch" event.

Milestones
----------

- core:UC-D-240 Developer deletes a milestone
  - From the milestone list and from the milestone's page, confirm dialog in both. Issues with the milestone keep
    no milestone.

Wiki
----

- core:UC-D-250 Wiki editor deletes a wiki page
  - Page → Edit → Delete Page, confirm dialog.
- core:UC-D-251 Wiki editor reverts a change to one page
  - Page → history → compare two revisions → Revert Changes. No confirm dialog.
- core:UC-D-252 Wiki editor reverts changes across the wiki
  - Wiki history → compare two revisions → Revert Changes. No confirm dialog.
