import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

const keys = await generateKeyPair("RS256", {
  extractable: true,
});
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

const privateKeyFormatted = privateKey.trimEnd().replace(/\n/g, " ");

execSync(`npx convex env set JWT_PRIVATE_KEY "${privateKeyFormatted}"`, { stdio: 'inherit' });
execSync(`npx convex env set JWKS '${jwks}'`, { stdio: 'inherit' });


try {
  const envContent = readFileSync(resolve(".env.local"), "utf8");
  const coApiKeyMatch = envContent.match(/^CO_API_KEY=(.+)$/m);

  if (coApiKeyMatch) {
    const coApiKey = coApiKeyMatch[1].trim();
    execSync(`npx convex env set CO_API_KEY "${coApiKey}"`, { stdio: 'inherit' });
    console.log("CO_API_KEY set successfully");
  } else {
    console.warn("CO_API_KEY not found in .env.local");
  }
} catch (error) {
  console.warn("Could not read .env.local file:", error.message);
}
// Set up self-hosted Convex configuration
execSync(`npx convex env set CONVEX_SELF_HOSTED_URL "http://localhost:3210"`, { stdio: 'inherit' });
console.log("CONVEX_SELF_HOSTED_URL set to http://localhost:3210");

try {
  console.log("Generating admin key for self-hosted Convex...");
  const adminKey = execSync('docker compose exec backend ./generate_admin_key.sh', {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit']
  }).trim();

  if (adminKey) {
    execSync(`npx convex env set CONVEX_SELF_HOSTED_ADMIN_KEY "${adminKey}"`, { stdio: 'inherit' });
    console.log("CONVEX_SELF_HOSTED_ADMIN_KEY set successfully");
  } else {
    console.warn("Failed to generate admin key");
  }
} catch (error) {
  console.warn("Could not generate admin key:", error.message);
  console.warn("Please run 'docker compose exec backend ./generate_admin_key.sh' manually and set CONVEX_SELF_HOSTED_ADMIN_KEY");
}
