import { auth } from '@/lib/firebase';

export async function getAdminToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function adminFetch(url: string, options?: RequestInit) {
  const token = await getAdminToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}
