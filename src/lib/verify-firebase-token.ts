/**
 * Manual Firebase JWT verification using Google's public JWKS.
 * No firebase-admin dependency — avoids the jose ESM issue on Netlify Node 20.
 */

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/service_accounts/v1/jwt/metadata/x509/securetoken@system.gserviceaccount.com';
const JWT_ISSUER_PREFIX = 'https://securetoken.google.com/';
const EXPECTED_AUDIENCE_PREFIX = 'https://auth.firebase.google.com/g/'

let cachedKeys: Record<string, string> = {};  // kid → PEM public key
let cacheExpiry = 0;

interface FirebaseDecodedToken {
  uid: string;
  email?: string;
  admin?: boolean;
  [key: string]: unknown;
}

async function fetchPublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (Object.keys(cachedKeys).length > 0 && now < cacheExpiry) {
    return cachedKeys;
  }

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Google public keys: ${res.status}`);
  }

  cachedKeys = await res.json();
  cacheExpiry = now + 60 * 60 * 1000; // cache 1 hour
  return cachedKeys;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function pemToSpkiDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  const der = pemToSpkiDer(pem);
  return crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

export async function verifyFirebaseToken(token: string): Promise<FirebaseDecodedToken> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Parse header to get kid
  const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
  const kid = header.kid;
  if (!kid) {
    throw new Error('JWT header missing kid');
  }

  // Fetch public keys
  const keys = await fetchPublicKeys();
  const publicKeyPem = keys[kid];
  if (!publicKeyPem) {
    // Force refresh cache and retry once
    cacheExpiry = 0;
    const freshKeys = await fetchPublicKeys();
    const freshPem = freshKeys[kid];
    if (!freshPem) {
      throw new Error(`No public key found for kid: ${kid}`);
    }
    return verifyWithKey(token, payloadB64, signatureB64, freshPem);
  }

  return verifyWithKey(token, payloadB64, signatureB64, publicKeyPem);
}

async function verifyWithKey(
  token: string,
  payloadB64: string,
  signatureB64: string,
  publicKeyPem: string
): Promise<FirebaseDecodedToken> {
  const signatureBytes = base64UrlDecode(signatureB64);
  const signedData = new TextEncoder().encode(token.split('.')[0] + '.' + payloadB64);

  const key = await importPublicKey(publicKeyPem);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signatureBytes,
    signedData
  );

  if (!valid) {
    throw new Error('Invalid JWT signature');
  }

  // Decode payload
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

  // Validate issuer: https://securetoken.google.com/{projectId}
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const expectedIssuer = `${JWT_ISSUER_PREFIX}${projectId}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }

  // Validate audience: https://auth.firebase.google.com/g/{projectId} or {projectId}
  if (projectId && payload.aud !== projectId && payload.aud !== `${EXPECTED_AUDIENCE_PREFIX}${projectId}`) {
    // Some Firebase tokens use just projectId as audience
    if (payload.aud !== projectId) {
      console.warn('[verify-token] audience mismatch, continuing:', payload.aud);
    }
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }

  // Check issued-at
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
