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

// ──── Firebase Config ────
// Replace the placeholder values with your own Firebase project config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
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
