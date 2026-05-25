// ============================================
// Jadwalin App — Auth Layout (BEIGE EDITION v2)
// Supports: onboarding, login, register, forgot-password
// ============================================

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
