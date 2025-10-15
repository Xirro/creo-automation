(Changelog)

2025-10-14 - Safety and login UX fixes
- Enforced server-authoritative deletion of MBOM breaker accessories: persistent deletes now require the DB primary key (`brkAccID`). Removed fallback delete-by-(pn + idDev) behavior that could delete multiple accessories.
- Renamed in-memory delete parameter to `arrIndex` for clarity and to avoid ambiguity with DB primary keys.
- Hardened `editBreaker.ejs` to guard against undefined rows and avoid template runtime errors.
- Fixed SQL placeholder parameter binding issues (ensure parameter arrays are passed to the DB wrapper).
- Improved login error handling and UI: server now logs full errors but surfaces friendly, non-sensitive messages to users; login alert is accessible and the login button/spinner resets correctly after failed attempts.

Files changed (high level):
- `app/controllers/mbomController.js`: enforce brkAccID-based deletes, prefer `arrIndex` for in-memory operations, fixed SQL param binding issues, and added defensive server-side checks.
- `public/assets/js/mbomBreakerAccessories.js`: renamed client in-memory delete to post `arrIndex`, ensured delete-from-edit posts only `brkAccID`, and strengthened client-side guards.
- `app/views/MBOM/*`: updated `searchMBOM.ejs`, `editBreaker.ejs`, and other MBOM views to add data attributes and guard against undefined data to avoid EJS runtime errors.
- `server.js`: improved login error mapping and safe server logging.

Note: several other view files and supporting scripts were updated to improve template safety and developer scripts; see git history for a full file list.

Developer convenience:
- Added a dev-only login bypass: username `simulateLocal` logs in without attempting a DB connection and sets `req.session.devBypass = true`. Use only for local development.
	- The bypass requires a password read from `DEV_BYPASS_PASSWORD` (default: 'development') to reduce accidental use.

2025-10-15 - Follow-up fixes and developer convenience
- Mapped additional engineering usernames (`sai_eng`, `sai_eng_admin`) to the production DB selection path to match existing `doadmin` handling.
- Added `app/config/database.local.js` template to make local DB overrides explicit (fill with local credentials; this file is gitignored). See README and docs for setup guidance.
- Performed repository housekeeping: reset last large commit to keep working-tree changes unstaged so edits could be split into smaller, focused commits.
- Minor template and client-side hardening (see 2025-10-14 entry). Continued to enforce server-authoritative deletes (persistent deletes require `brkAccID`) and rename in-memory delete parameter to `arrIndex`.

Developer notes:
- To test locally, copy and edit `app/config/database.local.js` with your MySQL/Docker credentials, then run the schema scripts in `scripts/` to initialize the local DB for testing.
- Use the dev-only login bypass (`simulateLocal`) only in trusted local environments; it requires `DEV_BYPASS_PASSWORD` to be set.

Full list of notable edits (working tree as of this commit):

- Server and auth
	- `server.js`: improved login error handling, added dev-local login bypass (`simulateLocal`) guard, mapped `sai_eng` and `sai_eng_admin` to production behavior used by `doadmin`.

- MBOM and breaker accessory flows
	- `app/controllers/mbomController.js`: enforce server-authoritative deletes by `brkAccID`, SELECT server-side `idDev` before DELETE, fix SQL placeholder parameter binding (pass arrays), defensive rendering to avoid template runtime errors.
	- `public/assets/js/mbomBreakerAccessories.js`: client now posts `brkAccID` for persistent deletes and uses `arrIndex` for in-memory deletes; added stricter DOM data-attribute checks.
	- `app/views/MBOM/editBreaker.ejs`, `app/views/MBOM/searchMBOM.ejs`, `app/views/MBOM/createComItem.ejs`: added data attributes, guarded array accesses, and hardened templates to avoid TypeErrors.

- Views and templates (misc)
	- `app/views/Main/login.ejs`, `app/views/Main/landingPage.ejs`, `app/views/MechEng/*`, `app/views/Rename/*`, `app/views/SlimVAC/*`, `app/views/Submittal/*`, `app/views/partComparison/*`: minor rendering and defensive updates to avoid runtime exceptions when data is missing or malformed.

- Configuration and developer convenience
	- `app/config/database.local.js` (template): new local override template created; it's gitignored. Use it to set host/user/password/database for local testing.
	- `FUTURE_FIXES.md`: notes appended about further hardening and test plans.

- Misc
	- `.env` updated locally (not committed) to support new dev bypass env var and other local-only values.
	- `uploads/12345A MBOM.xlsx` was removed from tracking (deleted from repo index).

If you want a smaller, focused commit per area (server/auth, controller, views, docs), I can split the working-tree changes into multiple commits. Currently this changelog entry records the aggregate of edits made during the safety and UX update work.

