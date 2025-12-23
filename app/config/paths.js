const fs = require('fs');
const path = require('path');

function debugLog(...args) {
  try {
    if (process.env.DEBUG_MODE && String(process.env.DEBUG_MODE).includes('server')) console.log.apply(console, args);
  } catch (e) { /* no-op */ }
}

function candidateViewDirs() {
  const candidates = [];
  candidates.push(path.join(__dirname, '..', 'app', 'views'));
  candidates.push(path.join(__dirname, '..', 'views'));
  candidates.push(path.join(process.cwd(), 'app', 'views'));
  candidates.push(path.join(process.cwd(), 'views'));
  try {
    if (process && process.execPath) {
      candidates.push(path.join(path.dirname(process.execPath), 'app', 'views'));
      candidates.push(path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'app', 'views'));
    }
  } catch (e) { /* ignore */ }
  return candidates;
}

function candidatePublicDirs() {
  const candidates = [];
  // Prefer packaged app.asar public when running as an installed app
  try {
    if (process && process.execPath) {
      candidates.push(path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'app', 'public'));
      candidates.push(path.join(path.dirname(process.execPath), 'public'));
    }
  } catch (e) { /* ignore */ }
  // Fallbacks for development / working directory
  candidates.push(path.join(__dirname, '..', 'public'));
  candidates.push(path.join(process.cwd(), 'public'));
  try {
    if (process && process.execPath) {
      // already added above when possible
    }
  } catch (e) { /* ignore */ }
  return candidates;
}

function searchFileRecursive(root, filename) {
  try {
    const stack = [root];
    while (stack.length) {
      const cur = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(cur, { withFileTypes: true });
      } catch (e) {
        continue;
      }
      for (const ent of entries) {
        try {
          const full = path.join(cur, ent.name);
          if (ent.isFile()) {
            if (ent.name === filename) return true;
          } else if (ent.isDirectory()) {
            stack.push(full);
          }
        } catch (e) { /* ignore per-entry errors */ }
      }
    }
  } catch (e) { /* ignore */ }
  return false;
}

function findValidated(candidates, validatorFilename) {
  for (const p of candidates) {
    try {
      if (!p) continue;
      if (searchFileRecursive(p, validatorFilename)) return p;
    } catch (e) { /* ignore and try next */ }
  }
  return null;
}

function findFirstExisting(candidates) {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) { /* ignore */ }
  }
  return null;
}

function getViewsPath() {
  const override = process.env.VIEWS_PATH;
  if (override) {
    try {
      if (fs.existsSync(override)) {
        debugLog('VIEWS_PATH override in use:', override);
        return override;
      }
      debugLog('VIEWS_PATH override not found:', override);
    } catch (e) { /* ignore */ }
  }

  const candidates = candidateViewDirs();
  // Prefer a candidate that contains the known projects view (search nested subfolders)
  const validated = findValidated(candidates, 'projectMain.ejs');
  if (validated) { debugLog('Validated views path:', validated); return validated; }

  const existing = findFirstExisting(candidates);
  if (existing) { debugLog('Using first existing views path:', existing); return existing; }

  const fallback = path.join(__dirname, '..', 'app', 'views');
  debugLog('Defaulting views path to:', fallback);
  return fallback;
}

function getPublicPath() {
  const override = process.env.PUBLIC_PATH;
  if (override) {
    try {
      if (fs.existsSync(override)) {
        debugLog('PUBLIC_PATH override in use:', override);
        return override;
      }
      debugLog('PUBLIC_PATH override not found:', override);
    } catch (e) { /* ignore */ }
  }

  const candidates = candidatePublicDirs();
  const existing = findFirstExisting(candidates);
  if (existing) { debugLog('Using public path:', existing); return existing; }

  const fallback = path.join(__dirname, '..', 'public');
  debugLog('Defaulting public path to:', fallback);
  return fallback;
}

module.exports = {
  getViewsPath,
  getPublicPath,
  _candidates: { view: candidateViewDirs, public: candidatePublicDirs }
};
