Test Cases: gist plugin
=======================

End-to-end scenarios of the bundled `gist` plugin; skipped when it isn't installed. IDs `gist:T-NNN`; ID scheme
and format in `../../docs/e2e-plan.md`.

### gist:T-001 A user creates a snippet, comments on it and deletes it
The user creates a public snippet with one file: its page shows the content. The user adds a comment: the comment
appears on the page. The user deletes the snippet and confirms: the snippet's page is not found any more.

Use cases: gist:UC-U-001, gist:UC-U-002, gist:UC-U-003
Requires: core, gist
Personas: a user (U)
Spec: plugins/gist/flows/gist.spec.js
Status: implemented
