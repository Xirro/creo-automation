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

