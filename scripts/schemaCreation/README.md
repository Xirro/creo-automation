# Schema Creation — Local Dev Bootstrap

This folder contains schema creation scripts and a bootstrap helper for creating
a local development database that mirrors the production schema used by the app.

Files
- `createCatalogSchema.js`, `createFinalSchema.js`, `createCreoSchema.js`, `createMBOMSchema.js`, `newPnSchema.js` — table creation and seed scripts.
- `createSubSchema.js` — destructive: drops and recreates the schema. Do NOT run on a live DB unless you intend to recreate it.
- `bootstrap-dev-db.ps1` — PowerShell helper that creates a dev database, app users, grants, and runs the non-destructive schema scripts.

Prerequisites
- Windows PowerShell (this script is a PowerShell script).
- Node.js installed (to run the schema `*.js` files).
- Either the `mysql` CLI on PATH (used to create DB and users) or provide DB admin credentials and run the SQL manually.

How to use

1) From the repository root run (interactive):

```powershell
.\scripts\schemaCreation\bootstrap-dev-db.ps1
```

The script will prompt for a DB admin username/password and will read app user
passwords from the following environment variables if set: `SAI_ADMIN_DB_PASS`,
`SAI_ENG_DB_PASS`, `SAI_USER_DB_PASS`.

2) To skip running the Node schema scripts (only create DB/users):

```powershell
.\scripts\schemaCreation\bootstrap-dev-db.ps1 -NoRunScripts
```

3) To run the destructive `createSubSchema.js` that drops/recreates the schema,
pass the `-AllowDestructive` flag (only do this in throwaway dev DBs):

```powershell
.\scripts\schemaCreation\bootstrap-dev-db.ps1 -AllowDestructive
```

Notes and safety
- The bootstrap script runs a safe, non-destructive ordering of the schema
  scripts by default and will skip `createSubSchema.js` unless explicitly
  allowed.
- Several schema files overlap and insert seed data; duplicates may result in
  repeated rows if the seed statements are not idempotent. Inspect or dedupe
  seed files if you need a normalized seed set.

If you want me to consolidate seed SQL into a single idempotent file or add a
one-command runner for macOS/Linux shells, tell me and I will prepare it.
