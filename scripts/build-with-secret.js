const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Usage: set LAUNCHER_SECRET in env, then run `node scripts/build-with-secret.js`
(async () => {
  try {
    // Allow passing the secret via CLI: --secret=VALUE or -s VALUE
    const argv = process.argv.slice(2);
    let secret = null;
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a.startsWith('--secret=')) secret = a.split('=')[1];
      if (a === '--secret' && argv[i+1]) secret = argv[i+1];
      if (a === '-s' && argv[i+1]) secret = argv[i+1];
    }
    secret = secret || process.env.LAUNCHER_SECRET;
    if (!secret) {
      console.error('Launcher secret not provided. Use --secret or set LAUNCHER_SECRET. Aborting build.');
      process.exit(1);
    }

    const projectRoot = path.join(__dirname, '..');
    const tmpConfigPath = path.join(projectRoot, 'electron-builder.tmp.json');

    // Read existing package.json build config so we don't accidentally drop fields
    let baseBuildConfig = {};
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      if (pkg && pkg.build) baseBuildConfig = pkg.build;
    } catch (e) {
      // ignore - we'll just write the extraMetadata
    }

    // Build a runtimeEnv object from environment variables passed into the build step.
    // These values will be injected into package.json via extraMetadata so the packaged
    // app can fallback to them at runtime when process.env does not provide them.
    // WARNING: embedding DB credentials into a distributable is a security risk. Only
    // do this for private/internal builds or with non-production credentials.
    const runtimeEnv = {
      DB_HOST: process.env.DB_HOST || null,
      DB_PORT: process.env.DB_PORT || null,
      DB_NAME: process.env.DB_NAME || null,
      DB_GUEST_PASSWORD: process.env.DB_GUEST_PASSWORD || null,
      SAI_ADMIN_DB_USER: process.env.SAI_ADMIN_DB_USER || null,
      SAI_ADMIN_DB_PASS: process.env.SAI_ADMIN_DB_PASS || null,
      SAI_ENG_DB_USER: process.env.SAI_ENG_DB_USER || null,
      SAI_ENG_DB_PASS: process.env.SAI_ENG_DB_PASS || null,
      SAI_USER_DB_USER: process.env.SAI_USER_DB_USER || null,
      SAI_USER_DB_PASS: process.env.SAI_USER_DB_PASS || null,
      SESSION_SECRET: process.env.SESSION_SECRET || null,
      DB_SSL: process.env.DB_SSL || null,
      NODE_ENV: process.env.NODE_ENV || null
    };

    // Merge extraMetadata into the build config so electron-builder receives the full config
    const config = Object.assign({}, baseBuildConfig, { extraMetadata: Object.assign({}, baseBuildConfig.extraMetadata || {}, { launcherSecret: secret, runtimeEnv: runtimeEnv }) });

    fs.writeFileSync(tmpConfigPath, JSON.stringify(config, null, 2));
    console.log('Wrote temporary electron-builder config to', tmpConfigPath);

    // Run electron-builder with the temporary config
    const args = ['--config', tmpConfigPath];
    const builder = spawn(path.join('node_modules', '.bin', 'electron-builder'), args, { stdio: 'inherit', cwd: projectRoot, shell: true });

    builder.on('exit', (code) => {
      try { fs.unlinkSync(tmpConfigPath); } catch (e) {}
      if (code === 0) {
        console.log('electron-builder finished successfully');
        process.exit(0);
      } else {
        console.error('electron-builder exited with code', code);
        process.exit(code || 1);
      }
    });
  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
})();
