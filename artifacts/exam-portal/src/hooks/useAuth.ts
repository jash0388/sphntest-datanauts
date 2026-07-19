import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface RollSession {
  rollNumber: string;
  fullName: string;
  email: string;
  token: string;
}

// A fake Firebase-User-shaped object built from a Rubrix session
// so the rest of the app (exam.tsx, dashboard.tsx, etc.) works unchanged
function makeVirtualUser(s: RollSession): User {
  return {
    uid: `roll_${s.rollNumber}`,
    email: s.email,
    displayName: s.fullName,
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as any,
    providerData: [],
    refreshToken: s.token,
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => s.token,
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    photoURL: null,
    providerId: 'roll-number',
  } as unknown as User;
}

function getStoredRollSession(): RollSession | null {
  try {
    const raw = localStorage.getItem('sphn_roll_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RollSession & { expiresAt?: string };
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem('sphn_roll_session');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function storeRollSession(session: RollSession & { expiresAt: string }) {
  localStorage.setItem('sphn_roll_session', JSON.stringify(session));
}

export function clearRollSession() {
  localStorage.removeItem('sphn_roll_session');
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check localStorage for Rubrix roll-number session first
    const rollSession = getStoredRollSession();
    if (rollSession) {
      setUser(makeVirtualUser(rollSession));
      setLoading(false);
      return;
    }

    // 2. Fall back to Firebase auth for any existing Firebase users
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
