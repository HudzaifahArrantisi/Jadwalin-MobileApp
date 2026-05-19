// ============================================
// Jadwalin App — Auth Service (BEIGE EDITION)
// Bug 10: registerWithEmail now accepts name
// ============================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '@/types/task.types';
import { getUserFriendlyError, isNetworkError } from '@/utils/networkError';

// ──── Helpers ────

/** Convert Firebase User to our UserProfile */
function mapFirebaseUser(user: User): UserProfile {
  return {
    uid: user.uid,
    name: user.displayName || 'Pengguna',
    email: user.email || '',
    photoURL: user.photoURL,
    createdAt: null as any, // will be set from Firestore
  };
}

/** Save or update user profile in Firestore */
async function saveUserProfile(user: User, extraData?: { name?: string }): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  
  const displayName = extraData?.name || user.displayName || 'Pengguna';

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      name: displayName,
      email: user.email || '',
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
    });
  } else {
    const currentData = snapshot.data();
    // Update name if needed, but preserve existing photoURL in Firestore if already set
    await setDoc(
      userRef,
      {
        name: currentData.name || displayName,
        photoURL: currentData.photoURL || user.photoURL || null,
      },
      { merge: true }
    );
  }
}

// ──── Auth Functions ────

/** Sign in with Google credential (from @react-native-google-signin) */
export async function signInWithGoogle(idToken: string): Promise<UserProfile> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  await saveUserProfile(result.user);
  return mapFirebaseUser(result.user);
}

/** Sign in with email & password */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await saveUserProfile(result.user);
  return mapFirebaseUser(result.user);
}

/** Register with email, password & name */
export async function registerWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  // Update Firebase Auth display name
  if (name) {
    await updateProfile(result.user, { displayName: name });
  }

  await saveUserProfile(result.user, { name });
  return {
    ...mapFirebaseUser(result.user),
    name: name || 'Pengguna',
  };
}

/** Sign out */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/** Send password reset email */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/** Listen to auth state changes */
export function onAuthChanged(
  callback: (user: UserProfile | null) => void,
  onError?: (error: Error, isOffline: boolean) => void
): () => void {
  let unsubscribeSnapshot: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }

      unsubscribeSnapshot = onSnapshot(userRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback({
            uid: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || 'Pengguna',
            email: firebaseUser.email || '',
            photoURL: data.photoURL || firebaseUser.photoURL || null,
            createdAt: data.createdAt,
            job: data.job || undefined,
            address: data.address || undefined,
          });
        } else {
          try {
            await saveUserProfile(firebaseUser);
            callback(mapFirebaseUser(firebaseUser));
          } catch (error) {
            callback(mapFirebaseUser(firebaseUser));
          }
        }
      }, (error) => {
        onError?.(new Error(getUserFriendlyError(error)), isNetworkError(error));
        callback(mapFirebaseUser(firebaseUser));
      });
    } else {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      callback(null);
    }
  }, (error) => {
    onError?.(new Error(getUserFriendlyError(error)), isNetworkError(error));
    callback(null);
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}

/** Get current user */
export function getCurrentUser(): UserProfile | null {
  const user = auth.currentUser;
  return user ? mapFirebaseUser(user) : null;
}
