/**
 * Run: node scripts/set-admin.js <email>
 * Example: node scripts/set-admin.js admin@assurini.dz
 *
 * Before running, either:
 *   1. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local, OR
 *   2. firebase login  (then the script uses your login session)
 */

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/set-admin.js <email>');
    process.exit(1);
  }

  // Try loading service account from env
  const fs = require('fs');
  const path = require('path');

  // Load .env.local manually
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }

  let app;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    app = getApps().length === 0
      ? initializeApp({ credential: cert(serviceAccount) })
      : getApps()[0];
  } else {
    // Fall back to application default credentials
    app = getApps().length === 0
      ? initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID })
      : getApps()[0];
    console.log('Using Application Default Credentials (firebase login)');
  }

  const adminAuth = getAuth(app);

  try {
    // Find user by email
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin claim set for ${email} (uid: ${user.uid})`);

    // Verify
    const updated = await adminAuth.getUser(user.uid);
    console.log('Claims:', updated.customClaims);
    console.log('\nNow log out and log in again for the token to refresh.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
