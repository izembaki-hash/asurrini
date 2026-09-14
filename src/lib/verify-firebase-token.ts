/**
 * Manual Firebase JWT verification using Google's public X.509 certificates.
 * No firebase-admin dependency — avoids the jose ESM issue on Netlify Node 20.
 */

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface FirebaseDecodedToken {
  uid: string;
  email?: string;
  admin?: boolean;
  [key: string]: unknown;
}

let cachedKeys: { keys: Record<string, string>; expiry: number } | null = null;

async function fetchPublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedKeys && cachedKeys.expiry > now && Object.keys(cachedKeys.keys).length > 0) {
    return cachedKeys.keys;
  }

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Google public keys: ${res.status}`);
  }

  const keys = (await res.json()) as Record<string, string>;
  cachedKeys = { keys, expiry: now + 60 * 60 * 1000 };
  return keys;
}

function clearCache() {
  cachedKeys = null;
}

function base64UrlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;

  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

/**
 * Extract SPKI DER public key bytes from an X.509 PEM certificate.
 * Uses Node.js crypto.X509Certificate API (Node 15.6+).
 */
function extractSpkiFromCert(certPem: string): Uint8Array {
  // Dynamic require so this module doesn't fail in edge runtimes that
  // don't have Node's crypto module — but for our use case (Node 20 server)
  // this is always present.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as typeof import('crypto');
  const cert = new nodeCrypto.X509Certificate(certPem);
  const pubKey = cert.publicKey;
  const spkiDer = pubKey.export({ format: 'der', type: 'spki' });
  return new Uint8Array(spkiDer);
}

async function importPublicKey(certPem: string): Promise<CryptoKey> {
  const spkiDer = extractSpkiFromCert(certPem);
  const subtle = (globalThis as any).crypto?.subtle;
  if (!subtle) {
    throw new Error('crypto.subtle is not available in this runtime');
  }
  return subtle.importKey(
    'spki',
    spkiDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

export async function verifyFirebaseToken(token: string): Promise<FirebaseDecodedToken> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: expected 3 parts');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  const headerJson = new TextDecoder().decode(base64UrlDecode(headerB64));
  const header = JSON.parse(headerJson);
  const kid = header.kid;
  if (!kid) throw new Error('JWT header missing kid');

  let keys = await fetchPublicKeys();
  let certPem = keys[kid];
  if (!certPem) {
    clearCache();
    keys = await fetchPublicKeys();
    certPem = keys[kid];
    if (!certPem) {
      throw new Error(`No public key found for kid: ${kid}`);
    }
  }

  const signatureBytes = base64UrlDecode(signatureB64);
  const signedData = new TextEncoder().encode(parts[0] + '.' + parts[1]);

  const key = await importPublicKey(certPem);
  const subtle = (globalThis as any).crypto?.subtle;
  if (!subtle) {
    throw new Error('crypto.subtle is not available in this runtime');
  }
  const valid = await subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signatureBytes,
    signedData
  );

  if (!valid) {
    throw new Error('Invalid JWT signature');
  }

  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
  const payload = JSON.parse(payloadJson);

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId && payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }
  if (projectId && payload.aud !== projectId) {
    throw new Error(`Invalid audience: ${payload.aud}`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }
  if (payload.iat && payload.iat > now + 300) {
    throw new Error('Token issued in the future');
  }

  return {
    uid: payload.user_id || payload.sub,
    email: payload.email,
    admin: payload.admin === true || payload.admin === 'true',
    ...payload,
  };
}
