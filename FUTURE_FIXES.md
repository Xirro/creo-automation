Future fixes and patches

This file tracks non-urgent, future fixes that should be applied to the repository. Each entry contains: a short title, the files to change, a concise implementation note, acceptance criteria, and a suggested priority.

1) Accessory modal "Save Changes" button (MBOM)
- Files: app/views/MBOM/searchMBOM.ejs, public/assets/js/mbomBreakerAccessories.js
- Problem: The accessory modal's Save button sometimes submits the main breaker form or navigates to the breaker-edit page instead of posting to the accessory-update endpoint (/editBreakerAcc). This causes the user to be redirected away from the MBOM page.
- Fix approach (Option A, recommended): Ensure the modal Save calls the accessory helper that POSTs to /editBreakerAcc (client-side helper builds a small form and submits). Implementation steps:
  1. In `searchMBOM.ejs` make the Save button call: onclick="editBrkAccBtn(this, <%= brkAccData[i].brkAccID %>)" (or onclick="editBrkAcc(<%= brkAccData[i].brkAccID %>)" if you prefer the existing helper signature).
  2. Add or ensure `public/assets/js/mbomBreakerAccessories.js` provides `editBrkAccBtn(button, brkAccID)` or `editBrkAcc(brkAccID)` that:
     - Locates the modal container for the clicked button and reads the modal's input fields (qty/type/desc/pn).
     - Gathers mbomID/jobNum/releaseNum from the page hidden inputs.
     - Builds a tiny POST form with those fields and action `../editBreakerAcc` and submits it.
  3. Confirm no code sets `brkForm.action` to `../editBreaker/?idDev=...` before the POST.
- Acceptance criteria:
  - Clicking Save performs a POST to `/editBreakerAcc` and the server redirects back to `searchMBOM` with updated accessory data visible.
  - No navigation to the breaker-edit page occurs.
  - DevTools Network shows a POST to `/editBreakerAcc` followed by a redirect to `searchMBOM`.
- Priority: High for MBOM UX correctness
- Estimated effort: small (1–2 edits + quick smoke test)


2) Convert inline EJS expressions in onclick attributes to safe data-attributes (editor warnings)
- Files: app/views/**/*.ejs (notably MBOM and Submittal views)
- Problem: Many onclick attributes include inline EJS expressions (e.g., onclick="fn(<%=i%>)") which cause "Expression expected" editor warnings and are brittle.
- Fix approach: Replace inline EJS-in-JS with data attributes on the element and use simple JS handlers or short inline onclick strings that read `this.dataset.*` (no embedded <%= %> inside JS expressions). Example:
  - Before: onclick="addBrkAccessoryFromEdit(<%= mbomBrkData[0].idDev %>)"
  - After: data-id="<%= mbomBrkData[0].idDev %>" onclick="addBrkAccessoryFromEdit(this.dataset.id)"
- Acceptance criteria: Editor warnings removed; behavior unchanged at runtime.
- Priority: Medium
- Estimated effort: small-to-medium depending on files changed

3) Eliminate nested <form> tags in `searchMBOM.ejs`
- Files: app/views/MBOM/searchMBOM.ejs
- Problem: There are nested/duplicated forms (for rows and row-action buttons) that produce invalid HTML and can cause unpredictable submission behavior.
- Fix approach: Use a single form per logical submission or a hidden `rowActionForm` that row-level action buttons populate and submit. Keep UI buttons as type="button" and set the hidden form's inputs + action then submit via JS.
- Acceptance criteria: No nested <form> elements, row action buttons continue to Copy/Edit/Delete using the hidden form technique.
- Priority: Medium
- Estimated effort: medium

4) Remove plaintext secrets from repo
- Files: app/config/config.json, app/config/database.js, server.js (session secret)
- Problem: Database passwords and session secret are checked into the repository.
- Fix approach: Move secrets to environment variables, replace working-tree values with placeholders, commit, then use `git filter-repo` or BFG to remove them from history. Coordinate with stakeholders to rotate credentials and notify collaborators about force-push / re-clone.
- Acceptance criteria: No secret literals remain in the working tree and history is rewritten (optional but recommended). Credentials rotated.
- Priority: Urgent (security)
- Estimated effort: medium (procedural)

--

Update (automated/manual):
- Environment variable support was confirmed in `app/config/database.js` and `server.js`.
- Removed the visible plaintext dev password from the commented block in `app/config/database.js` (moved to local override or env as documented).
- `server.js` now reads `SESSION_SECRET` from env with a dev fallback.
- Added `.env.example` documenting required variables and added `.env` to `.gitignore`. Also ensured `app/config/database.local.js` is gitignored.
- The server was started successfully during verification, but the runtime hit a schema error on the target DB (ER_NO_SUCH_TABLE: `saidb.layoutSum`), indicating the local environment needs a populated database or the app pointed to a dev DB for UI tests.

Next immediate actions (recommended):
1. Rotate any credentials that were present in history (if they were ever valid) before performing any history rewrite.
2. Create a local `app/config/database.local.js` or copy `.env.example` to `.env` with working local DB credentials for developer testing.
3. Run the schema/setup scripts (scripts/create*.js) against a dev DB if you want to exercise UI pages locally.
4. After rotation, consider a history purge with `git filter-repo` or BFG (I can prepare exact commands and a collaborator checklist when you're ready).


5) Gate Creoson initialization and make server startup resilient for developers
- Files: controllers that touch creoson, creoson/creoson.js, server.js
- Problem: Creoson startup attempts can fail and block local developer workflows.
- Fix approach: Respect CREOSON_ENABLED env var; lazy-initialize Creoson client inside request handlers or use a safe stub during development.
- Acceptance criteria: Server starts locally without Creoson and pages render enough to do UI tests.
- Priority: Low/medium

6) Add a lightweight EJS compile check script and a lint job
- Files: scripts/, package.json scripts
- Problem: EJS template syntax errors (missing tags) previously caused runtime crashes.
- Fix approach: Add a Node script that compiles all EJS views (using ejs.compile) and fail CI if compile errors occur. Add an npm script `npm run ejs-check` and (optionally) integrate into CI pipeline.
- Acceptance criteria: ejs-check returns non-zero on syntax errors.
- Priority: Low

---
Notes:
- The Accessory Save button fix (item #1) is included exactly as you requested — the suggested code change and a minimal JS helper approach are listed. I left the exact function name flexible so it fits your preferred client helper (`editBrkAcc` vs `editBrkAccBtn`).
- If you want, I can open a PR that implements item #1 only and run the smoke test (start server w/ CREOSON disabled and exercise the MBOM accessory Save flow). Reply "Please implement #1 and run smoke tests" and I'll proceed.

