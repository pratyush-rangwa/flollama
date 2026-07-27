# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo currently contains a single app: **`next/`** — a Next.js 15 (App Router) web client and backend for Flollama, an AI chatbot. All commands below assume `cd next` first (there is no root-level `package.json`).

A native mobile client (Expo/React Native) is planned but not yet scaffolded anywhere in this repo — see "Planned: mobile app" at the bottom.

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

## Planned: mobile app (not yet started)

There is a plan to build a from-scratch Expo/React Native (SDK 54) mobile client in this repo that reuses this Next.js app's backend and design system rather than porting it file-for-file. Key intended decisions, for context if this work begins:

- Reuses `/api/chat` and `/api/summarize-title` as-is (never call Gemini directly from the mobile client — that would leak `GEMINI_API_KEY`).
- Reuses the color/type tokens from `_variables.scss`, with one deliberate override: dark background becomes `#141414` (not `#1c1c1c`), per Figma.
- Deliberately diverges from the web app's architecture in a few places that are fine for a scrappy web app but not for a shipped mobile app: Firestore chat IDs become UUIDs instead of the title string (title becomes a plain field, since two chats can currently summarize to the same title and collide as-is); message appends use `arrayUnion` instead of the read-then-write pattern in `chatService.js`; messages get an explicit `pending`/`sent`/`failed` status for optimistic UI instead of silently disagreeing with Firestore on write failure; the first-assistant-reply trigger is explicit from the "create chat" action instead of the `messages.length == 1` `useEffect` pattern in `ChatContainer.jsx`.
- Uses `@react-native-firebase/*` (not the `firebase` JS SDK used here) for native Google Sign-In and background persistence.

None of this exists in the repo yet — treat it as background, not as current architecture.
