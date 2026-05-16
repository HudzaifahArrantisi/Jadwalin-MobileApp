// ============================================
// Jadwalin App — Firebase Configuration
// ============================================
// 
// INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Add a Web app to your project
// 4. Copy the firebaseConfig values below
// 5. Enable Authentication → Google provider
// 6. Enable Cloud Firestore database
//

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore — expo compatibility
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Env } from '@/constants/env';

// ──── Firebase Config ────
// Replace the placeholder values with your own Firebase project config
const firebaseConfig = {
  apiKey: Env.FIREBASE_API_KEY,
  authDomain: Env.FIREBASE_AUTH_DOMAIN,
  projectId: Env.FIREBASE_PROJECT_ID,
  storageBucket: Env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Env.FIREBASE_APP_ID,
  measurementId: Env.FIREBASE_MEASUREMENT_ID
};

// ──── Initialize Firebase ────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence (works in Expo Go)
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Auth already initialized
  auth = getAuth(app);
}

// Initialize Firestore with long-polling to prevent WebChannelConnection stream errors
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

export { app, auth, db };
