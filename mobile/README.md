# Flollama Mobile

Expo (SDK 54) + TypeScript client for Flollama. Pure client of the `next/` app's
`/api/chat` and `/api/summarize-title` routes — no model calls happen on-device,
and the Gemini API key never ships in this app.

Because it depends on `@react-native-firebase/*` and native Google Sign-In,
this is a **bare/dev-client app, not Expo Go**. Use `expo prebuild` + EAS Build
(or `expo run:ios` / `expo run:android`) rather than the Expo Go app.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_API_BASE_URL` — the deployed `next/` app's origin (e.g. your
     local `next dev` server, or `https://flollama.in`).
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — the Web OAuth client ID from the
     **same Firebase project** as `next/.env`'s `NEXT_PUBLIC_FIREBASE_*` values.
3. Download `GoogleService-Info.plist` (iOS) and `google-services.json`
   (Android) from that same Firebase project's console and drop them at the
   repo root of `mobile/` (paths referenced in `app.json`). Both are
   git-ignored.
4. `npx expo prebuild` to generate the native `ios/`/`android/` projects, then
   `npm run ios` / `npm run android`.

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
