# CLAUDE.md

Standing rules for this repository. Read this before every task. The detailed build
plan lives in SPEC.md — follow it. This file is the short, always-on version of the
conventions; when in doubt, SPEC.md wins on specifics.

## Project

Mini SaaS Product Management Dashboard: authenticated users manage products, view
summary metrics, and access is controlled by role (admin, viewer). Single Next.js
project — the `app/api` routes plus server-side `lib/` folders ARE the Node.js
backend; the React pages and components are the frontend. One repo, separated by
execution environment.

## Build process

- Build in the phases defined in SPEC.md, in order. Do NOT jump ahead.
- After each phase, stop for review and a commit before continuing.
- Do not one-shot the whole project.

## Stack (do not change without asking)

- Next.js 16 (App Router, Turbopack default), React 19, TypeScript 5.
- Node.js 24 LTS.
- Firebase modular client SDK (`import { getAuth } from "firebase/auth"` style, never
  the namespaced `firebase.auth()` style) + `firebase-admin` on the server.
- Zod for validation.
- Tailwind CSS v3.4 — NOT v4. Use classic v3 config: `tailwind.config.js` with a
  `content` array and the `@tailwind base/components/utilities` directives. Do not use
  v4's CSS-first `@import "tailwindcss"` style. Do not mix v3 and v4 conventions.
- State: React `useState` / `useContext` only. No Redux, Zustand, or other state
  library.
- Dependency-light: only the approved dependencies in SPEC.md. Ask before adding
  anything else.

## Architecture rules (enforce always)

- Layered backend: route handler -> service -> repository. Data flows one direction.
- ONLY `lib/repositories/*` may import Firestore / the Admin Firestore instance. No
  Firestore calls in routes or services.
- No business logic in route handlers. They do HTTP + auth only, then call a service.
- The repository returns plain objects, never Firestore snapshots.
- `lib/auth/server/*` uses the Admin SDK and is server-only (mark with
  `import "server-only"`). `lib/auth/client/*` uses the client SDK and runs in the
  browser. Never mix the two.
- Organize backend BY LAYER (services/, repositories/, validation/), not by feature.
  A new entity adds files into the existing layer folders.

## Security (non-negotiable)

- Enforce authentication and role on the server for every protected route. Verify
  tokens with the Admin SDK (`verifyIdToken`) — never manually decode a JWT.
- Hiding UI controls by role is UX only, never the security mechanism.
- Never commit secrets. `.env.local` and the Firebase service account JSON are
  gitignored. `.env.example` (empty values) is committed.
- The service account is used only in `lib/firebase/admin.ts` (server). It never gets
  a `NEXT_PUBLIC_` prefix and never reaches the browser.
- Client Firebase config uses `NEXT_PUBLIC_*` vars (safe for the browser by design).
- No secrets or tokens in URLs; tokens travel in the `Authorization: Bearer` header.
- Return correct status codes (401/403/400/404) with generic messages; no stack
  traces leaked.

## Code quality

- TypeScript everywhere. Shared types in `types/`.
- Single responsibility per file and function. Clear, sensible names.
- DRY: shared logic (auth checks, error mapping, validation) lives in one place.
- No over-engineering (YAGNI). Build only what SPEC.md's scope lists. Out-of-scope
  items (multi-tenancy, metrics aggregate, pagination, AI feature) are documented in
  the README, not built.
- Keep it readable over clever.

## Git

- Commit at each phase boundary with a conventional message (`feat:`, `chore:`,
  `docs:`, `test:`, `fix:`).
- Before any commit, run `git status` and confirm no secret (`.env.local`, service
  account JSON) is tracked or staged.
- If a secret was ever committed, purge it from history — do not just delete it in a
  new commit.
