Test Cases: notifications plugin
================================

End-to-end scenarios of the bundled `notifications` plugin; skipped when it isn't installed. IDs `notifications:T-NNN`; ID scheme
and format in `../../docs/e2e-plan.md`.

### notifications:T-001 A developer changes how they watch a repository
The developer opens the repository and chooses another entry in the watch button: the button shows it at once, and
after a reload too. At the end the developer chooses the entry from before again.

Use cases: notifications:UC-D-001
Requires: core, notifications
Personas: a developer collaborator (D)
Spec: plugins/notifications/flows/notifications.spec.js
Status: implemented

### notifications:T-002 A user turns email notifications off
The user opens Account settings → Notifications, checks Disable and saves: after a reload Disable is still checked.
At the end the user unchecks it and saves again.

Use cases: notifications:UC-U-002
Requires: core, notifications
Personas: a user (U)
Spec: plugins/notifications/flows/notifications.spec.js
Status: implemented
