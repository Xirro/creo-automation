PR: Upgrade dependencies, remove deprecated packages, and fix vulnerabilities

Summary

- Replaced deprecated `request` / `request-promise` usage with `axios` in server-side Creoson integration and related controllers.
- Removed the deprecated `request`, `request-promise`, and unmaintained `ejs-locals` packages from `package.json`.
- Removed `window` (and its transitive `jsdom` / `request` / `form-data`) since it was unused and introduced critical vulnerabilities.
- Ran `npm install` and `npm audit` and validated that `npm audit` reports 0 vulnerabilities.

Files changed (high level)
- `modules/baseFrames.js` — switch to axios
- `creoson/creoson.js` — switch to axios
- `app/controllers/*` — switched Creoson calls to axios
- `package.json` — removed `request`, `request-promise`, `ejs-locals`, `window`; bumped several direct deps to security-fixed versions
- Audit snapshots: `npm-audit-after-*.json`

Migration notes / Testing checklist

1) Install and run locally
   - Git checkout the branch and run `npm install`.
   - Start the server: `npm run dev` or `node server.js`.

2) Smoke test critical flows
   - Login page and authenticated pages
   - MBOM/MechEng pages that call Creoson endpoints (these now use `axios`)
   - Excel import/export features (`read-excel-file` was upgraded)
   - Any endpoints that performed HTTP calls previously using `request`

3) Template rendering
   - `ejs-locals` was removed; if you relied on layout helpers from `ejs-locals`, the project already includes `express-ejs-layouts`. If any templates or middleware break, either switch to `express-ejs-layouts` usage or add a small adapter.

4) Package lock
   - `package-lock.json` is ignored by .gitignore. For reproducible installs, consider removing it from `.gitignore` and committing the lockfile.

5) Rollback
   - To revert: checkout `main` or reset the branch.

Notes
- Many upgrades were conservative; some packages (e.g., `sequelize`, `mysql2`, `jsonwebtoken`) were upgraded and may have semver-major changes. Test DB interactions and token verification carefully.
- If you want, I can open the PR on your behalf (requires repository push permission) or provide the exact git push / PR commands to run locally.
