import { spawnSync } from "child_process";

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", {
  extractable: true,
});
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

const privateKeyFormatted = privateKey.trimEnd().replace(/\n/g, " ");

// Set JWT_PRIVATE_KEY using NAME=value format to avoid parsing issues
const jwtResult = spawnSync("npx", ["convex", "env", "set", `JWT_PRIVATE_KEY=${privateKeyFormatted}`], {
  stdio: "inherit",
});

// Set JWKS using NAME=value format
const jwksResult = spawnSync("npx", ["convex", "env", "set", `JWKS=${jwks}`], {
  stdio: "inherit",
});

// Set SITE_URL using NAME=value format
const siteUrlResult = spawnSync("npx", ["convex", "env", "set", "SITE_URL=http://localhost:5173"], {
  stdio: "inherit",
});
