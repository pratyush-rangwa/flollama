# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two apps, no root-level `package.json`:
- **`next/`** — Next.js 15 (App Router) web client and backend for Flollama, an AI chatbot. Owns the only backend: `/api/chat` and `/api/summarize-title`.
- **`mobile/`** — Expo (SDK 57) + TypeScript native client. Pure consumer of the `next/` app's API routes; see "Mobile app" below.

## Commands (run from `next/`)

- `npm run dev` — start dev server with Turbopack
- `npm run build` — production build (also runs `next-sitemap` via `postbuild`)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (`next/core-web-vitals` config)

There is no test suite configured in this project.

### Environment variables

Required in `next/.env` (or `.env.local`):
- `GEMINI_API_KEY` — server-side only, used by the API routes
- `GEMINI_MODEL` — optional, defaults to `gemini-3.1-flash-lite`
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` — Firebase client config

## Commands (run from `mobile/`)

- `npm install`
- `npx tsc --noEmit` — type-check
- `npm run lint` — ESLint (`eslint-config-expo` flat config)
- `npx expo-doctor` — validate SDK/dependency alignment after touching `package.json`
- `npx expo prebuild` then `npm run ios` / `npm run android` — this is a bare/dev-client app (native Firebase + Google Sign-In), not Expo Go

Required env vars are documented in `mobile/.env.example`; see `mobile/README.md` for full setup (Firebase config files, Google OAuth client id).

## Architecture

### Route groups and auth gating

The app router has two independent root layouts under `src/app/`:
- **`(site)/`** — public marketing/landing page (Hero, About, CTA, NavBar, Footer). Renders login/signup as modals (`AuthModalContext`) rather than separate routes.
- **`chat/`** — the actual product, wrapped in `ProtectedRouteProvider` (redirects `/` ↔ `/chat` based on auth state) and `AppShell` (persistent `Sidebar` + `TopBar`, with `Settings` as an overlay, not a route).

Both layouts read the same top-level providers from `src/app/layout.js`: `ThemeProvider` → `AuthModalProvider` → `AuthProvider`. `chat/layout.js` additionally wraps in `ProtectedRouteProvider` and `UIProvider` (sidebar/settings/small-screen UI state, not auth).

Redirect logic between the public and chat trees is duplicated in two places — `(site)/page.js` and `ProtectedRoute.jsx` — both watching `useAuth()` + `usePathname()`. If you change auth-redirect behavior, update both.

### Chat data flow

- **`src/app/chat/page.js`** (new chat): user types a message → `POST /api/summarize-title` generates a 2–4 word lowercase title → that title string becomes the Firestore document ID directly (`saveChatMessages(uid, title, [])` then `appendMessage`) → router pushes to `/chat/{title}`.
- **`src/app/chat/[chatName]/page.js`**: looks up the chat by decoding the URL segment as the doc ID (`doesChatExist` + `loadChatMessages`, both live `onSnapshot` listeners), then renders `ChatContainer`.
- **`ChatContainer.jsx`**: holds `messages` in local `useState`, calls `chatWithFlollama()` (in `lib/ollamaApi.js`) which streams `POST /api/chat` and invokes a callback per chunk to build up `streamingMsg`. On completion, appends the full assistant message to Firestore. **The first assistant reply is auto-triggered by a `useEffect` keyed on `messages.length == 1`** — this is how a brand-new chat gets its first response without an explicit "generate" call from the new-chat page.

**Known sharp edge (do not silently "fix" without checking `next/API.md` and `chatService.js` first):** `appendMessage()` in `src/lib/chatService.js` does a `getDoc` → spread → `updateDoc`, not `arrayUnion`. This is a read-then-write race under concurrent writes. It's the current, deployed behavior — treat any change here as a deliberate behavior change, not a bug fix, unless asked.

### Firestore schema

`users/{uid}/chats/{chatId}` — `chatId` is the AI-generated title string itself (not a UUID), document body is `{ messages: [{ role, content }] }` with no per-message id/timestamp and no `title`/`createdAt`/`updatedAt` fields. All reads are via `onSnapshot` (`src/lib/chatService.js`): `listenToUserChats`, `loadChatMessages`, `doesChatExist`.

### Backend API routes (do not duplicate the system prompt or call Gemini from a client)

- **`POST /api/chat`** (`src/app/api/chat/route.js`) — takes `{ messages: [{role, content}] }`, streams back raw `text/plain` chunks (not SSE, not JSON-per-line) from `gemini-3.1-flash-lite` via `@google/genai`'s `generateContentStream`. System prompt + few-shot examples + generation config all live here, server-side only, keyed off `GEMINI_API_KEY`. Non-200 responses return `{ error: string }` JSON instead of a stream.
- **`POST /api/summarize-title`** (`src/app/api/summarize-title/route.js`) — takes `{ input: string }` (truncated server-side to 2000 chars), returns `{ title: string }` (2–4 lowercase words, punctuation stripped). Falls back to the first 4 words of the input if the model returns nothing.
- Full external-consumer documentation (multi-language client examples) is in `next/API.md` — useful context for anything that talks to `/api/chat` from outside this Next app.

### Design tokens

Colors are defined once in `src/styles/_variables.scss` as CSS custom properties (`--color-light-*` / `--color-dark-*`), remapped to theme-agnostic `--color-*` names under `[data-theme="light"]` / `[data-theme="dark"]` selectors, then exposed to Tailwind utility classes via `tailwind.config.js` (`text-text`, `bg-background`, `text-accent`, etc.). `ThemeProvider.jsx` toggles `data-theme` on `<html>` and persists the choice to `localStorage`. Type scale (`.h1`–`.h5`, `.body*`, `.caption`, `.label`, `.logo*`) is also defined in `_variables.scss`, not in Tailwind config. Fonts are loaded via `next/font/google` in `src/font/fonts.jsx`: Inter (primary/UI), Poppins (secondary/markdown content), Ubuntu (logo wordmark only), Noto Sans (broad-script fallback).

Button variants (`PrimaryButton`, `SecondaryButton`, `OutlineButton`, `LinkButton`, `SidebarButton`, `DangerousButton`, `DangerousOutlineButton`) are thin wrappers in `src/components/ui/Button.jsx` that just apply a class name — all actual styling is in `globals.scss`.

The llama wordmark SVG (`viewBox="0 0 350 372"`, two `<path>` elements) is duplicated verbatim across `Auth.jsx`, `Sidebar.jsx`, `Footer.jsx`, `NavBar.jsx`, and `chat/page.js` — there is no shared `<Logo>` component in this codebase.

### Path alias

`@/*` → `src/*` (configured in `jsconfig.json`).

## Mobile app (`mobile/`)

An Expo (SDK 57) + TypeScript + Expo Router client, scaffolded from scratch — not a port. Pure client of this app's `/api/chat` and `/api/summarize-title` routes (never calls Gemini directly, which would leak `GEMINI_API_KEY`). See `mobile/README.md` for setup and `mobile/src/theme.ts` for the design tokens ported from `_variables.scss` (one override: dark background is `#141414`, not the web's `#1c1c1c`, per Figma).

It deliberately diverges from this web app's architecture in ways that matter for a shipped mobile app but were fine to skip for a side project:
- Firestore chat IDs are client-generated UUIDs (`mobile/src/lib/chatService.ts`), not the title string — two chats summarizing to the same title no longer collide, and `title` is a plain field instead of the doc ID.
- Message appends use `arrayUnion` instead of this app's `getDoc`→spread→`updateDoc` race.
- Messages carry an explicit `pending`/`sent`/`failed`/`streaming` status (`mobile/src/store/chatStore.ts`, Zustand) instead of silently disagreeing with Firestore on a failed write.
- The first assistant reply is triggered explicitly from the "create chat" action (`createChatAndSend`), not from a `messages.length == 1` `useEffect` like `ChatContainer.jsx`.
- Uses `@react-native-firebase/*` + `@react-native-google-signin/google-signin` (not the `firebase` JS SDK used here) for native Google Sign-In and background persistence — this makes it a bare/dev-client app, not Expo Go.
- Uses `@react-native-firebase`'s **modular** API (`getAuth`, `getFirestore`, `onSnapshot`, `arrayUnion`, matching the Firebase Web SDK v9+ shape) throughout — the namespaced style this web app uses (`auth()`, `firestore()`) is deprecated as of react-native-firebase v22 and shouldn't be introduced into `mobile/`.

Cross-check `next/src/lib/chatService.js`, `next/src/app/api/*/route.js`, and `next/src/styles/_variables.scss` against their `mobile/` counterparts before assuming either side is still in sync — they're maintained by hand, not generated from each other.
