const mysql2 = require('mysql2/promise');
const dbConfig = require('./database.js').connection || {};

// Map role name to environment variables. For development you can set these env vars.
// Production: use a secret manager and inject as env vars at process start.
const roleEnvMap = {
    admin: { userEnv: 'SAI_ADMIN_DB_USER', passEnv: 'SAI_ADMIN_DB_PASS' },
    engineer: { userEnv: 'SAI_ENG_DB_USER', passEnv: 'SAI_ENG_DB_PASS' },
    // minimally-privileged service account used for authoritative reads (preferred)
    user: { userEnv: 'SAI_USER_DB_USER', passEnv: 'SAI_USER_DB_PASS' }
};

async function withRoleConn(roleName, fn) {
    const map = roleEnvMap[roleName];
    if (!map) throw new Error('Unknown role for DB connection: ' + roleName);

    const user = process.env[map.userEnv] || (dbConfig && dbConfig.user) || null;
    const password = process.env[map.passEnv] || (dbConfig && dbConfig.password) || null;

    if (!user || !password) {
        throw new Error(`DB credentials for role '${roleName}' are not configured. Set ${map.userEnv} and ${map.passEnv} in the environment.`);
    }

    const host = process.env.DB_HOST || dbConfig.host || '127.0.0.1';
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : (dbConfig.port || 3306);
    const database = process.env.DB_NAME || dbConfig.database || 'saidb';

    const conn = await mysql2.createConnection({ host, port, user, password, database });
    try {
        return await fn(conn);
    } finally {
        try { await conn.end(); } catch (e) { /* ignore close errors */ }
    }
}

module.exports = withRoleConn;

/*
    Notes: swapping to Azure Key Vault for secrets

    Recommended approaches:
    1) Fetch secrets at process start (preferred):
         - Use the Key Vault SDK at application startup to read SAI_ADMIN_DB_USER / SAI_ADMIN_DB_PASS
             and set them on process.env (or write into an in-memory config object). This keeps
             the runtime path fast and avoids contacting Key Vault on every DB operation.

    2) Fetch secrets on demand inside withRoleConn (simpler but slower):
         - Call Key Vault each time withRoleConn is invoked to obtain the role credentials.

    Example (pseudo-code) using @azure/identity and @azure/keyvault-secrets:

    // npm install @azure/identity @azure/keyvault-secrets
    const { DefaultAzureCredential } = require('@azure/identity');
    const { SecretClient } = require('@azure/keyvault-secrets');

    async function fetchSecretFromKeyVault(vaultUrl, secretName) {
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(vaultUrl, credential);
        const secret = await client.getSecret(secretName);
        return secret.value;
    }

    // Usage pattern A (startup):
    // (async () => {
    //   process.env.SAI_ADMIN_DB_USER = await fetchSecretFromKeyVault('https://myvault.vault.azure.net', 'sai-admin-user');
    //   process.env.SAI_ADMIN_DB_PASS = await fetchSecretFromKeyVault('https://myvault.vault.azure.net', 'sai-admin-pass');
    // })();

    // Usage pattern B (on-demand inside withRoleConn):
    // Replace the lines that read from process.env with calls to fetchSecretFromKeyVault(vaultUrl, secretName)
    // Note: this will add latency to each withRoleConn call and may require caching.

    Security notes:
    - Use a managed identity or service principal for the app to access Key Vault; avoid embedding Vault credentials.
    - Cache secrets in memory with a TTL rather than fetching per-request to reduce latency and Key Vault request costs.
    - Rotate secrets via Key Vault and reload them into the app (or rely on short TTL cache to pick up changes).
*/
