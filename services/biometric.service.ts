// ============================================
// Jadwalin App — Session Service (Previously Biometric)
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'jadwalin_session_token';

// ─── Session Persistence (AsyncStorage) ───

/** Save session token */
export async function saveSession(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, token);
  } catch (error) {
    console.warn('Failed to save session:', error);
  }
}

/** Restore session token */
export async function restoreSession(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/** Clear session token */
export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear session:', error);
  }
}
