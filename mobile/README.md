# Flollama Mobile

Expo (SDK 54) + TypeScript client for Flollama. Pure client of the `next/` app's
`/api/chat` and `/api/summarize-title` routes — no model calls happen on-device,
and the Gemini API key never ships in this app.

## Why Expo Go won't work

This app uses `@react-native-firebase/*` and `@react-native-google-signin/google-signin`,
which are **native modules** — they don't exist inside the stock Expo Go app.
Opening this project in Expo Go will fail (or silently break auth/Firestore).
You need a **development build** instead: your own compiled app binary that
includes these native modules, with the Metro JS bundler still connecting to
it live for fast refresh — same DX as Expo Go, just with your own native code
included.

## Setup (do this once)

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_API_BASE_URL` — the deployed `next/` app's origin (e.g. your
     local `next dev` server on your LAN IP so a physical device can reach it,
     or `https://flollama.in`).
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — the **Web** OAuth client ID from the
     same Firebase project as `next/.env`'s `NEXT_PUBLIC_FIREBASE_*` values
     (Firebase Console → Authentication → Sign-in method → Google → Web SDK
     configuration, or Google Cloud Console → Credentials).
3. Download `GoogleService-Info.plist` (iOS) and `google-services.json`
   (Android) from that same Firebase project's console and place them at the
   repo root of `mobile/` (paths referenced in `app.json`). Both are
   git-ignored — never commit them.
4. In `app.json`, replace the `REPLACE_WITH_IOS_CLIENT_ID` placeholder in the
   `@react-native-google-signin/google-signin` plugin config with your
   project's **iOS** OAuth client ID, reversed (the `REVERSED_CLIENT_ID` value
   inside `GoogleService-Info.plist`).

## Running it locally (development build)

Pick whichever you have available:

**A. You have Xcode/Android Studio installed:**
```
npx expo prebuild        # generates ios/ and android/ native projects
npm run ios              # or: npm run android
```
This builds a dev-client binary on your machine and installs it on a
simulator/device, then starts Metro automatically.

**B. You don't have native toolchains installed (cloud build via EAS):**
```
npm install -g eas-cli
eas login
eas build --profile development --platform ios      # or android, or both
```
Install the resulting build on your device/simulator (EAS gives you a link/QR
for internal distribution), then run:
```
npx expo start --dev-client
```
and open the dev-client app you just installed — it connects to this Metro
server the same way Expo Go would, but with the native Firebase/Google
Sign-In modules actually present.

After the first native build, day-to-day iteration is just `npx expo start
--dev-client` — you only need to rebuild when native dependencies change.

## Production build

This repo ships an `eas.json` with `development` / `preview` / `production`
profiles.

```
eas build --profile production --platform ios       # or android, or both
eas submit --platform ios                            # ships to App Store Connect
eas submit --platform android                        # ships to Google Play
```

You'll need an Apple Developer account (iOS signing) and a Google Play
Console + upload key (Android signing) — `eas build` will walk you through
generating/registering credentials on first run if you don't have them yet.

## Brand assets

`assets/icon.png`, `assets/adaptive-icon.png`, and `assets/splash-icon.png`
are copied directly from `next/assets/logo-dark.png` (the same 1000×1000
mark used as the web app's dark-mode logo); `assets/favicon.png` is copied
from `next/public/web-app-manifest-192x192.png`. The `LlamaLogo` and
`GoogleGLogo` in-app components use the exact SVG path data from
`next/src/components/Sidebar.jsx` and `next/public/google-logo.svg`
respectively — see `src/components/LlamaLogo.tsx` / `GoogleGLogo.tsx`.

`logo-dark.png`'s mark isn't inset with Android's adaptive-icon safe zone in
mind (it nearly fills the 1000×1000 canvas), so some launchers' circular/
squircle masks may crop its outer edge slightly. Fine for now; worth a real
padded adaptive-icon asset from design before a Play Store release.

## Structure

- `app/` — Expo Router routes: `login`, `(app)/index` (chat list),
  `(app)/chat/[id]` (thread; `id === "new"` renders the pre-creation composer).
- `src/theme.ts` — typed design tokens (colors/type scale), ported from
  `next/src/styles/_variables.scss` with one override: dark background is
  `#141414`, not the web's `#1c1c1c`. `tailwind.config.js` mirrors it by hand.
- `src/lib/api.ts` — `/api/chat` streaming client and `/api/summarize-title`
  (with client-side title fallback).
- `src/lib/chatService.ts` — Firestore layer. Same `users/{uid}/chats/{chatId}`
  shape as the web app, but `chatId` is a client-generated UUID (not the title
  string) and message appends use `arrayUnion` instead of read-then-write.
- `src/store/chatStore.ts` — Zustand store for chat/message state, including
  per-message `pending`/`sent`/`failed`/`streaming` status and the explicit
  "create chat" trigger for a new thread's first assistant reply.

See the repo root `CLAUDE.md` for the full architecture writeup and the
deliberate departures from the web app's approach.
