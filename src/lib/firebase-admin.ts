import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let _app: App | null = null;

function getApp(): App | null {
  if (_app) return _app;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return null;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  _app = getApps().length === 0
    ? initializeApp(serviceAccount
        ? { credential: cert(serviceAccount) }
        : { projectId: projectId! }
      )
    : getApps()[0];

  return _app;
}

let _db: Firestore | null = null;
let _auth: Auth | null = null;

export function getAdminDb(): Firestore {
  if (!_db) {
    const app = getApp();
    if (!app) throw new Error('Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
    _db = getFirestore(app);
  }
  return _db;
}

export function getAdminAuth(): Auth {
  if (!_auth) {
    const app = getApp();
    if (!app) throw new Error('Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
    _auth = getAuth(app);
  }
  return _auth;
}

function createLazyProxy<T>( getter: () => T ): T {
  return new Proxy({} as T, {
    get(_, prop) {
      const target = getter();
      const value = (target as any)[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
  });
}

export const adminDb = createLazyProxy(() => getAdminDb());
export const adminAuth = createLazyProxy(() => getAdminAuth());
