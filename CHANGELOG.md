# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.0-beta] - 2025-10-03
### Added
- Beta release for testing installer workflow and MBOM runtime fixes.
- CHANGELOG.md and release tag v1.0.0.

### Changed
- MBOM section add/delete flows are now wrapped in database transactions to ensure atomic renumbering and prevent partial updates.
- Replaced fragile inline EJS-in-JS patterns with data-* attributes and centralized DOMContentLoaded binders across MBOM and other views.
- Replaced inline form-action mutations with `button formaction` where appropriate.
- Fixed malformed EJS placeholders in Submittal templates causing template parse errors.
- Updated accessory UI: "Add Loose Accessories" checkbox and "Add Accessory" button restored and made robust.
- Installer filename now includes the Git tag (e.g. `CreoAutomationInstaller-v0.1.0-beta.exe`).

### Fixed
- Prevent Node process crashes during Generate MBOM (XLSX export) and improved file handling around Excel generation.
- Fixed `TypeError: Cannot read properties of undefined (reading 'secID')` by using stable `secID` PK for section delete and safer DB access patterns.

### Notes
- Please run MBOM smoke tests (Add Section, Delete Section, Generate MBOM) against a test/development database before deploying to production.
- The repository `main` branch now contains these changes and a `v1.0.0` git tag has been created.
