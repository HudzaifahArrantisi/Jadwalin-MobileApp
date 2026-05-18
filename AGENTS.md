# Repository Guidelines

## Project Structure & Module Organization

JadwalinApp is an Expo Router React Native app written in TypeScript. Route screens live in `app/`, with grouped stacks such as `app/(auth)/` and `app/(tabs)/`. Shared UI is in `components/`, hooks in `hooks/`, theme and app constants in `constants/`, Firebase and feature APIs in `services/`, Zustand state in `store/`, shared types in `types/`, and helpers in `utils/`. Static images and app icons are under `assets/images/`. Native Android files are in `android/`; keep generated native changes scoped.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm start`: launch the Expo development server.
- `npm run android`: build and run the app on Android with the Expo dev client.
- `npm run ios`: build and run the app on iOS.
- `npm run web`: start the Expo web target.
- `npm run lint`: run Expo ESLint checks.
- `npm run reset-project`: run `scripts/reset-project.js`; use only when intentionally resetting scaffolding.

## Coding Style & Naming Conventions

Use TypeScript and functional React components. Keep components in `PascalCase` files such as `TaskCard.tsx`, hooks as `useName.ts`, services as `feature.service.ts`, and shared types as `*.types.ts`. Prefer small, typed functions and colocate route-specific code in the route file unless reused. Follow the Expo ESLint flat config in `eslint.config.js`; run `npm run lint` before opening a PR. Use theme constants from `constants/` rather than hard-coded colors when practical.

## Testing Guidelines

No automated test runner is currently configured in `package.json`. When adding tests, introduce the script and keep test files near the code they cover using names like `TaskCard.test.tsx` or `task.service.test.ts`. Until then, validate with `npm run lint` and manual Expo checks on the affected platform.

## Commit & Pull Request Guidelines

Recent history uses short messages with prefixes such as `fix`, `update`, and `chore`. Keep commits concise and action-oriented, for example `fix task calendar refresh` or `chore update firebase config ignore rules`. Pull requests should include a summary, affected screens or services, validation performed, linked issues when available, and screenshots or recordings for UI changes.

## Security & Configuration Tips

Do not commit secrets. Treat `.env`, `google-services.json`, and `GoogleService-Info.plist` as sensitive unless the team decides otherwise. Document Firebase and Expo configuration changes in the PR body, especially when they affect builds, auth, notifications, or native plugins.
