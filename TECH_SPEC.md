# JadwalinApp — Technical Specification & Build Rules

## Stack & Versions (DO NOT change these without explicit permission)

| Component | Version | Notes |
|---|---|---|
| Expo SDK | ~54.0.33 | Do NOT upgrade |
| React Native | 0.81.5 | Set by Expo, do NOT override |
| Node.js | >=18 | |
| TypeScript | ~5.3.3 | |
| Expo Router | ~4.0.x | File-based routing |
| Firebase | ^11.x | Auth + Firestore + Storage |
| expo-auth-session | ~6.x | Google Sign-In (Android only) |
| expo-crypto | ~14.x | Required by expo-auth-session |
| expo-web-browser | ~14.x | Required by expo-auth-session |
| react-native-reanimated | ~4.1.x | |
| react-native-screens | ~4.16.x | |
| react-native-gesture-handler | ~2.28.x | |
| react-native-safe-area-context | ~5.6.x | |
| @react-native-async-storage/async-storage | 2.2.0 | |
| expo-notifications | ~0.30.x | |
| expo-build-properties | ~1.0.x | |

---

## Android Native Build (CRITICAL — READ CAREFULLY)

| Component | Version | Rule |
|---|---|---|
| AGP (Android Gradle Plugin) | 8.11.0 | **NEVER** override. Set automatically by EAS. |
| Gradle | 8.14.3 | **NEVER** override. Set automatically by EAS. |
| Kotlin | 2.1.20 | **NEVER** override. |
| compileSdkVersion | 36 | Set via expo-build-properties only |
| targetSdkVersion | 36 | Set via expo-build-properties only |
| minSdkVersion | 24 | Set via expo-build-properties only |
| New Architecture | true | Do NOT disable |

---

## EAS Build Rules (CRITICAL)

- `android/` folder is in `.gitignore` — EAS generates it fresh on every build via `npx expo prebuild --clean`
- **NEVER** add `withGradleFixes` or any function that pins Gradle/AGP version in config plugins
- **NEVER** manually edit `android/build.gradle`, `android/settings.gradle`, `android/gradle.properties`, or `android/gradle/wrapper/gradle-wrapper.properties`
- **NEVER** add `expo-auth-session` to the `plugins` array in `app.config.js` — it has no config plugin
- **NEVER** install `expo-random` — it is deprecated and breaks builds
- `google-services.json` must be excluded from `.gitignore` but included for EAS via `!google-services.json` in `.easignore`
- Only use `expo-build-properties` to configure Android SDK versions

---

## Config Plugin Rules (`plugins/withJadwalinWidget.js`)

The project has a custom Android widget config plugin. Rules:

- Plugin may **only**: generate XML layouts, generate Kotlin files, patch `AndroidManifest.xml`, patch `MainApplication.kt`
- Plugin must **NOT**: touch `build.gradle`, `settings.gradle`, `gradle.properties`, or `gradle-wrapper.properties`
- Widget layouts must use `<TextView>` instead of `<View>` for dividers and dots — Android RemoteViews does not support plain `<View>`
- `MainApplication.kt` must always include:

```kotlin
import com.candalena.JadwalinApp.widget.JadwalinWidgetPackage
// inside getPackages():
add(JadwalinWidgetPackage())
```

- SharedPreferences key: `"jadwalin_prefs"`, data key: `"jadwalin_widget_data"`
- Use `commit()` NOT `apply()` in `JadwalinWidgetModule.kt` for synchronous writes

---

## Platform Rules

| Platform | Google Sign-In | Email/Password | Firebase |
|---|---|---|---|
| Android | ✅ Enabled | ✅ Enabled | ✅ Full access |
| iOS | ❌ Disabled | ✅ Enabled | ✅ Full access |

- Google Sign-In iOS is intentionally disabled — no Apple Developer Account.
- `Google.useAuthRequest` must always include `iosClientId: 'disabled'` to prevent crashes on iOS.

---

## App Identity

| Item | Value |
|---|---|
| App Name | Jadwalin |
| Package | com.candalena.JadwalinApp |
| Scheme | jadwalinapp |
| EAS Project ID | 612b98a8-f0c7-4611-a5c4-b3720545d64b |
| EAS Owner | candalena |
| Firebase Project | jadwalin-fc9f0 |

---

## What To Do Before Every Code Change

1. Read this file (`TECH_SPEC.md`) completely
2. Check if the change involves native Android code → if yes, only modify files inside `plugins/withJadwalinWidget.js` or `android/app/src/main/java/`
3. Never add new npm packages without checking Expo SDK 54 compatibility first using `npx expo install <package>` — **NOT** `npm install`
4. If adding a new config plugin, verify it has an `app.plugin.js` file before adding to `plugins` array
5. After any native change, remind the user to run `npx eas build --profile development --platform android`

---

## Common Errors & Prevention

| Error | Cause | Prevention |
|---|---|---|
| `AgpVersionAttr '8.11.0' — No variants exist` | Gradle downgraded by config plugin | Never touch `gradle-wrapper.properties` in plugins |
| `Cannot find native module 'ExpoCrypto'` | Running on Expo Go instead of dev build | Always use development build APK |
| `iosClientId must be defined` | `Google.useAuthRequest` missing `iosClientId` | Always pass `iosClientId: 'disabled'` |
| `google-services.json is missing` | File in `.gitignore` without `.easignore` exception | Add `!google-services.json` to `.easignore` |
| `Unable to resolve config plugin expo-auth-session` | Added to `plugins` array | Never add `expo-auth-session` to plugins |
| `EBUSY: resource busy or locked` | Java process locking `.gradle` files | Run `taskkill /F /IM java.exe` before build |
