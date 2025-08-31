import { execSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const envLocalContent = `# put in .env.local to have \`npx convex dev\` work automatically
CONVEX_SELF_HOSTED_URL='http://127.0.0.1:3210'
CONVEX_SELF_HOSTED_ADMIN_KEY=''
CO_API_KEY=
`;

try {
  writeFileSync(resolve(".env.local"), envLocalContent);
  console.log("✔ Successfully created .env.local");
} catch (error) {
    console.error("❌ Failed to create .env.local:", error.message);
    process.exit(1);
}

try {
  console.log("Generating admin key for self-hosted Convex...");
  const adminKey = execSync('docker compose exec backend ./generate_admin_key.sh', {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit']
  }).trim();

  if (adminKey) {
    execSync(`npx convex env set CONVEX_SELF_HOSTED_ADMIN_KEY "${adminKey}"`, { stdio: 'inherit' });
    console.log("CONVEX_SELF_HOSTED_ADMIN_KEY set successfully");

    // Update .env.local with the new admin key
    const envContent = readFileSync(resolve(".env.local"), "utf8");
    const updatedEnvContent = envContent.replace(
      /^CONVEX_SELF_HOSTED_ADMIN_KEY='.*'$/m,
      `CONVEX_SELF_HOSTED_ADMIN_KEY='${adminKey}'`
    );
    writeFileSync(resolve(".env.local"), updatedEnvContent);
    console.log("✔ Successfully updated .env.local with admin key");

  } else {
    console.warn("Failed to generate admin key");
  }
} catch (error) {
  console.warn("Could not generate admin key:", error.message);
  console.warn("Please run 'docker compose exec backend ./generate_admin_key.sh' manually and set CONVEX_SELF_HOSTED_ADMIN_KEY");
}

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", {
  extractable: true,
});
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

const privateKeyFormatted = privateKey.trimEnd().replace(/\n/g, " ");

spawnSync('npx', ['convex', 'env', 'set', 'JWT_PRIVATE_KEY', privateKeyFormatted], { stdio: 'inherit' });
spawnSync('npx', ['convex', 'env', 'set', 'JWKS', jwks], { stdio: 'inherit' });

