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
    const config = {
      "extraMetadata": {
        "launcherSecret": secret
      }
    };

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
