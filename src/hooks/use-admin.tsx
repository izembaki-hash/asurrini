'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';

interface AdminContextType {
  isAdmin: boolean | null;
}

const AdminContext = createContext<AdminContextType>({ isAdmin: null });

let cachedAdmin: boolean | null = null;
let pendingPromise: Promise<void> | null = null;

async function resolveAdmin(): Promise<boolean | null> {
  if (cachedAdmin !== null) return cachedAdmin;

  if (pendingPromise) {
    await pendingPromise;
    return cachedAdmin;
  }

  pendingPromise = new Promise<void>(async (resolve) => {
    const user = auth.currentUser;
    if (!user) {
      cachedAdmin = false;
      resolve();
      return;
    }
    try {
      const tr = await getIdTokenResult(user);
      cachedAdmin = tr.claims.admin === true;
    } catch {
      cachedAdmin = false;
    }
    resolve();
  });

  await pendingPromise;
  pendingPromise = null;
  return cachedAdmin;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      cachedAdmin = null;
      pendingPromise = null;
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const result = await resolveAdmin();
      setIsAdmin(result);
    });

    return unsubscribe;
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}

export function useAdminGuard() {
  const { isAdmin } = useAdmin();
  return isAdmin;
}

export { resolveAdmin };
