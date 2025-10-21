
Electron build and launcher-secret

This document describes how to build the Electron-packaged version of the app and how to inject the `launcherSecret` into the packaged `package.json` so the launcher and server can use it for authenticated local operations.

## Local build (recommended)

1. Install dev deps (once):

```powershell
npm install
```

2. Build with a secret without exporting env vars (preferred):

```powershell
node ./scripts/build-with-secret.js --secret "your-super-secret"
```

3. Or using environment variable:

```powershell
$env:LAUNCHER_SECRET = 'your-super-secret'; npm run build:electron
```

This helper will write a temporary electron-builder config that places `launcherSecret` into the packaged `package.json` (`extraMetadata.launcherSecret`) and runs `electron-builder`.

## Behavior at runtime

- `server.js` and `electron/main.js` will first look for `process.env.LAUNCHER_SECRET`.
- If not present, they will attempt to read `launcherSecret` from the packaged `package.json` (top-level `launcherSecret` or `build.launcherSecret`).

## CI Integration (example - GitHub Actions)

Below is a small example job that runs on `windows-latest` and uses a repo secret named `LAUNCHER_SECRET`.

```yaml
name: Build Electron
on: [push]
jobs:
	build:
		runs-on: windows-latest
		steps:
			- uses: actions/checkout@v4
			- name: Setup Node
				uses: actions/setup-node@v4
				with:
					node-version: '18'
			- name: Install deps
				run: npm ci
			- name: Build Electron (inject secret)
				env:
					LAUNCHER_SECRET: ${{ secrets.LAUNCHER_SECRET }}
				run: node ./scripts/build-with-secret.js
			- name: Upload artifact
				uses: actions/upload-artifact@v4
				with:
					name: electron-build
					path: dist/**
```

Notes:
- Keep `LAUNCHER_SECRET` secret in your CI provider's secrets store.
- If you want even more protection, consider storing secrets in a platform keyvault and retrieving them at runtime for signing or build-time operations.

## Security note
Embedding `launcherSecret` into the packaged metadata is convenient but discoverable by anyone who can unpack the app. For higher security, consider:
- Using OS-provided secure storage (Keychain/DPAPI) at runtime to store secrets.
- Encrypting the secret and decrypting it at runtime with platform-protected keys.

If you'd like, I can add a GitHub Actions workflow file to `.github/workflows` that runs this build step and stores the artifact automatically. Let me know and I will add it.
