# Jadwalin App - Gemini Context

This document provides foundational context, architectural overview, and development guidelines for the **Jadwalin App**.

## Project Overview

**Jadwalin** is an aesthetic, minimalist productivity application designed for time management, scheduling, and note-taking. It features a "Beige Edition" and "Black Premium" design system, focusing on a premium user experience that feels like a modern digital planner.

### Core Features
- **Interactive Calendar**: Horizontal and full-month views with activity indicators.
- **Task Management**: Daily and weekly task tracking with timeline views and completion status.
- **Notes (Daftar Saya)**: Multi-level note-taking system with category-based organization.
- **Cloud Synchronization**: Real-time sync across devices using Firebase.
- **Theming**: Support for Light (Beige) and Dark (Premium Black) modes.
- **Offline Support**: Local persistence of tasks and settings for offline access.

### Technology Stack
- **Framework**: [Expo](https://expo.dev/) (React Native) with TypeScript.
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing).
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with `persist` middleware.
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore).
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native) & Custom Design Tokens.
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/).

---

## Architecture & Directory Structure

- `app/`: Entry point and file-based routing logic (Expo Router).
  - `(auth)/`: Authentication flow (Login, Register, Onboarding).
  - `(tabs)/`: Main application features (Home, Calendar, Tasks, Notes, Settings).
- `components/`: Reusable UI components.
  - `ui/`: Atomic UI components (Icons, Collapsibles).
- `services/`: External API integrations and business logic (Firebase, Notifications, Biometrics).
- `store/`: Global state management using Zustand.
- `hooks/`: Reusable React hooks for UI logic and data fetching.
- `constants/`: Theme definitions, colors, and global constants.
- `types/`: TypeScript type definitions and interfaces.
- `utils/`: Helper functions (Date formatting, etc.).
- `assets/`: Static assets (Images, Fonts).

---

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- Expo Go app (for mobile testing) or Android/iOS Emulator.

### Commands
- **Install Dependencies**: `npm install`
- **Start Development Server**: `npx expo start`
- **Run on Android**: `npx expo start --android`
- **Run on iOS**: `npx expo start --ios`
- **Run on Web**: `npx expo start --web`
- **Linting**: `npm run lint`

---

## Development Conventions

### Coding Style
- **TypeScript**: Strictly use TypeScript for all new code. Define interfaces in `types/` for shared data structures.
- **Functional Components**: Prefer functional components with hooks.
- **Styling**: Use **NativeWind** (Tailwind) classes for layout and simple styling. For complex theme-dependent styles, use `constants/theme.ts`.
- **Naming**: 
  - Components: PascalCase (e.g., `TaskItem.tsx`).
  - Hooks: camelCase starting with `use` (e.g., `useTasks.ts`).
  - Services/Utils: camelCase (e.g., `auth.service.ts`).

### State Management Patterns
- Use **Zustand** (`store/taskStore.ts`) for global application state that needs to persist or be shared across many components.
- Use local `useState` for component-specific UI state.
- Use **Services** (`services/`) to encapsulate Firebase logic, and call these from hooks or stores.

### Backend Integration
- Firebase Firestore is used for real-time data sync.
- Authentication state is managed in `hooks/useAuth.ts` and synced with the Zustand store.
- Always use the `subscribeToTasks` pattern for real-time updates to ensure UI consistency.

### Testing
- *Current Status*: No automated test suite detected.
- *TODO*: Implement unit tests for services and utility functions using Jest.

---

## Project Instructions

- **Security**: Never commit Firebase config secrets or sensitive keys. Ensure `.env` or similar mechanism is used if needed (though Expo handles `app.json` for some config).
- **Performance**: Use `memo` and `useCallback` where appropriate, especially in list items (`TaskItem.tsx`) to prevent unnecessary re-renders in large lists.
- **Responsiveness**: Ensure layouts work on various screen sizes using Flexbox and NativeWind's responsive utilities.
