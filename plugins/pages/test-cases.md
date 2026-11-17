Test Cases: pages plugin
========================

End-to-end scenarios of the bundled `pages` plugin; skipped when it isn't installed. IDs `pages:T-NNN`; ID scheme
and format in `../../docs/e2e-plan.md`.

### pages:T-001 A repository owner changes the Pages source
The owner opens Settings → Pages, chooses another source and applies the change: after a reload the new source is
selected. At the end the owner selects the source from before again.

Use cases: pages:UC-O-001
Requires: core, pages
Personas: a repository owner (O)
Spec: plugins/pages/flows/pages.spec.js
Status: implemented
