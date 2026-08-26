# Build Spec: Mini SaaS Product Management Dashboard

This spec is written to be handed to a code generation agent (Claude Code). Build
exactly what is described here. Do not add features beyond this scope. Where a
future extension is mentioned, leave a clean seam for it but do NOT implement it.

---

## Prerequisites (complete before phase 1)

These accounts and tools must exist before the build starts. Some are chicken-and-egg
(the app cannot run without a Firebase project and credentials), so set them up first.

- **Node.js 24 LTS** and npm installed (`node -v` to confirm). Use a current LTS;
  Node 18 and 20 are end-of-life and should not be used for a new project. Pin the
  version with an `.nvmrc` and an `engines` field in `package.json`.
- **GitHub account** and an empty public repository created for the submission.
- **Google account** for Firebase.
- **Firebase project** created in the console, with:
  - Email/Password sign-in enabled (Authentication > Sign-in method).
  - A Firestore database created.
  - Client web config values copied (Project settings > Your apps > Web app).
  - A service account private key generated (Project settings > Service accounts).
    This JSON is a secret and must never be committed.
- Have the client config and service account values ready to paste into `.env.local`
  once phase 1 scaffolds `.env.example`.

The end-user facing version of this (for anyone cloning the finished repo) lives in
the README's Setup section. This section is the builder's pre-flight.

---

## Build in phases (do not one-shot the project)

Build in the dependency order below, one phase at a time. After each phase, stop for
review and a commit before continuing. Do not jump ahead.

1. Scaffold + config + `.gitignore` (ignore `node_modules`, `.env.local`, service
   account) + `.env.example`.
2. Firebase init (`lib/firebase/client.ts`, `admin.ts`).
3. Errors + types + validation (`lib/errors`, `types/product.ts`, `productSchema.ts`).
4. Repository (`productRepository.ts`).
5. Service (`productService.ts`).
6. Auth gate (`lib/auth/server/middleware.ts`).
7. API routes (`route.ts`, `[id]/route.ts`).
8. Client session + hooks (`session.ts`, `useAuth`, `useProducts`).
9. Auth pages (login/signup).
10. Dashboard + components (list, filter/sort, metrics, role-based UI).
11. Security rules + indexes.
12. Testing approach documented in the README (no test suite built; see section 9a).
13. README.

Commit at each boundary with a clear message (for example `feat: add product
repository (Firestore data access layer)`). Never commit secrets; verify with
`git status` that `.env.local` and the service account are ignored.

### `.gitignore` must include (set in phase 1, before the first commit)

At minimum, `.gitignore` must contain these entries so no secret or build artifact
is ever committed:

```
# dependencies
node_modules/

# env & secrets
.env
.env.local
.env*.local
serviceAccountKey.json
*serviceAccount*.json
firebase-adminsdk*.json

# next.js build output
.next/
out/
build/

# misc
.DS_Store
*.log
npm-debug.log*
```

`.env.example` (with empty values) IS committed; every `.env*` with real values is
NOT. The Firebase service account JSON must never be committed in any form — its
values live only in `.env.local`. After scaffolding `.gitignore`, run `git status`
and confirm none of the above appear as tracked or staged before the first commit.
If any secret was ever committed in an earlier attempt, it must be purged from
history, not just deleted in a new commit.

---

## 0. Guiding principles (apply to every file)

- **Single Responsibility.** Each file and function does one thing. If a function
  needs "and" to describe it, split it.
- **Separation of concerns / layering.** HTTP, business logic, and data access are
  distinct layers. Only the repository layer may reference Firestore.
- **DRY.** Shared logic (auth checks, error mapping, validation) lives in one place
  and is reused.
- **Open for extension, closed for modification.** Adding a new entity or feature
  should mean adding files, not rewriting existing ones. Follow the repository +
  service + route pattern so it repeats cleanly.
- **YAGNI / no over-engineering.** Build only what this spec lists. No CQRS, no
  event bus, no DTO layer, no state management library, no ORM, no microservices.
- **Dependency light.** Only add a dependency when hand rolling it would be clearly
  worse. Approved dependencies are listed in section 9. Do not add others without a
  noted reason.
- **Clean boundaries.** Data crossing a layer boundary is a plain typed object, not
  a framework specific object (no Firestore snapshots above the repository).
- **Readable over clever.** Sensible names, small functions, comments only where the
  reason is non obvious.
- **Type safety.** Use TypeScript throughout with shared types front to back.

---

## 1. Stack

- Next.js (App Router) + React + TypeScript
- Firebase Authentication (Email/Password)
- Firestore (via Firebase Admin SDK on the server)
- Firebase Admin SDK for server side token verification and role assignment
- Tailwind CSS v3.4 for responsive styling (light, no component kit). The assignment
  requires a responsive, accessible UI but names no styling tool; Tailwind is a
  choice for speed and may be swapped for plain CSS / CSS Modules. v3.4 is chosen
  over v4 for stability and ecosystem/training-data maturity.
- Zod for input validation (doubles as type source)

This is a single Next.js project, not a separate frontend and backend. The "Node.js
API" the assignment asks for IS the server side code: the `app/api` route handlers
plus `lib/services`, `lib/repositories`, `lib/auth/server`, and `lib/firebase/admin`
all run in Node.js on the server. The React pages and components run in the browser.
One repo, separated by execution environment, not by being two applications.

State management: React built-ins only (`useState`, `useContext` via the hooks
above). No Redux, Zustand, or other library. State here is small and local; a
library would be unjustified.

Versions and pinning:
- Scaffold with the current stable Next.js (16.x, App Router, Turbopack default) and
  React 19 via `create-next-app@latest`, using `--typescript`, `--app`, and
  `--eslint`. App Router, not Pages Router. Do NOT pass `--tailwind` (that flag now
  installs Tailwind v4); Tailwind is added separately as v3.4, see below.
- Target versions: Node 24 LTS, Next.js 16.x, React/react-dom 19.x, TypeScript 5.x
  (5.1+ required by Next 16), firebase (modular client SDK, current major),
  firebase-admin (current), zod (current), tailwindcss v3.4.
- Take the latest stable PATCH of Next.js at scaffold time (there have been security
  releases through 2026); do not pin to an old minor with known CVEs.
- Use the Firebase modular SDK v9+ import style (`import { getAuth } from
  "firebase/auth"`), never the deprecated namespaced `firebase.auth()` style. Two
  packages: `firebase` (client) and `firebase-admin` (server).
- Tailwind is intentionally v3.4, NOT v4. Rationale: v3.4 is the stable, mature,
  most-documented version, it matches the bulk of training data and examples so
  generated config and classes are reliable, and it composes cleanly with Next 16 /
  React 19 (Tailwind is a build-time tool decoupled from the React version). Install
  and init the v3 way:
  `npm install -D tailwindcss@3 postcss autoprefixer` then `npx tailwindcss init -p`.
  Use the classic v3 setup: a `tailwind.config.js` with a `content` array covering
  `./app/**/*` and `./components/**/*`, and the three directives
  `@tailwind base; @tailwind components; @tailwind utilities;` in the global CSS. Do
  NOT use the v4 CSS-first style (`@import "tailwindcss"`, `@theme`,
  `@tailwindcss/postcss`). Do not mix v3 and v4 conventions.
- Pin resolved versions in `package.json` and commit the lockfile so the reviewer
  gets exactly the versions this was built and tested against. Record the built-with
  versions in the README.

---

## 1a. Canonical folder structure (build to this exactly)

Organize the backend BY LAYER, not by feature. Each layer folder holds files named
by entity. Do not create a per-entity folder such as `lib/products/`. A second
entity later (for example `orders`) adds `orderRepository.ts`, `orderService.ts`,
`orderSchema.ts` INTO the existing layer folders, changing nothing that exists.

```
.
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── api/
│   │   └── products/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── firebase/
│   │   ├── client.ts
│   │   └── admin.ts
│   ├── auth/
│   │   ├── server/
│   │   │   └── middleware.ts
│   │   └── client/
│   │       └── session.ts
│   ├── repositories/
│   │   └── productRepository.ts
│   ├── services/
│   │   └── productService.ts
│   ├── validation/
│   │   └── productSchema.ts
│   └── errors/
│       └── index.ts
├── components/
│   ├── products/
│   │   ├── ProductList.tsx
│   │   ├── ProductForm.tsx
│   │   └── ProductRow.tsx
│   ├── dashboard/
│   │   └── MetricsBar.tsx
│   └── ui/
├── hooks/
│   ├── useAuth.ts
│   └── useProducts.ts
├── types/
│   └── product.ts
├── scripts/
│   └── setAdmin.ts
├── firestore.rules
├── firestore.indexes.json
├── .env.local
├── .env.example
└── README.md
```

File responsibilities (kept out of the tree so lines never wrap):

- `app/(auth)/` — route group for `/login` and `/signup`; parentheses keep it out of the URL. `layout.tsx` is an optional shared shell.
- `app/dashboard/page.tsx` — protected page: product list, filter/sort, metrics.
- `app/api/products/route.ts` — GET (list), POST (create).
- `app/api/products/[id]/route.ts` — GET (one), PUT, DELETE.
- `app/page.tsx` — landing / redirect by auth state.
- `lib/firebase/client.ts` — client SDK init (browser).
- `lib/firebase/admin.ts` — Admin SDK init (server only).
- `lib/auth/server/middleware.ts` — `requireAuth`, `requireRole` (Admin SDK, server-only).
- `lib/auth/client/session.ts` — `getToken`, `getCurrentUser` (client SDK).
- `lib/repositories/productRepository.ts` — the only Firestore-aware file for products.
- `lib/services/productService.ts` — business rules, defaults, existence checks.
- `lib/validation/productSchema.ts` — Zod schema; server-side, optionally reused client-side.
- `lib/errors/index.ts` — `AppError`, `NotFoundError`, `ValidationError`, `handleError`.
- `components/products/*` — list, form (admin only), row (hides actions for viewers).
- `components/dashboard/MetricsBar.tsx` — summary metrics.
- `components/ui/` — small shared presentational pieces.
- `hooks/useAuth.ts` — current user + role via context.
- `hooks/useProducts.ts` — single client entry point to the product API.
- `types/product.ts` — `Product`, `ProductInput`, `Role`, filter/sort types.
- `scripts/setAdmin.ts` — promote a user to admin (custom claim + users doc).

Note on single-file folders: with one entity, layer folders each hold one file. This
is intentional, not overkill. The folders group by responsibility so a second entity
fills them without restructuring. For a single entity the layer folders could be
flattened to `lib/*.ts`; the layered form is kept to make the extension path explicit
and match the README. Frontend groups by feature (`components/products`,
`components/dashboard`) because UI clusters by screen area; backend groups by layer.
The split is deliberate.

Validation runs server-side inside the service before any write (the server never
trusts client input). The same Zod schema may optionally be reused client-side in the
form for inline feedback, but that is UX only and never replaces the server check.

---

## 2. Core requirements (must build)

### 2.1 Authentication and authorization
- Email/password sign up and sign in via Firebase Auth.
- Two roles: `admin` and `viewer`. New users default to `viewer`.
- On sign up, create a `users/{uid}` document `{ email, role: "viewer", createdAt }`
  and set a custom claim `{ role: "viewer" }` via the Admin SDK.
- Protect all dashboard pages: unauthenticated users are redirected to login.
- Protect all API routes: see section 4 for the exact gate.
- Follow OWASP basics: tokens only in the Authorization header (never in URLs),
  service account key in an env var and gitignored, generic error messages, correct
  status codes.

### 2.2 Product CRUD
- Product shape: `{ name, category, price, status: "active" | "inactive",
  createdAt, updatedAt }`.
- Full CRUD through a clean layered backend (route -> service -> repository).
- Admin can create, update, delete. Viewer can only read.

### 2.3 Dashboard and data display
- Responsive dashboard page listing products.
- Filter (by status and by category) and sort (by at least price and createdAt).
  Category filtering and the create/edit form both read from the same fixed,
  hardcoded category list (see section 3 and the README's Categories section)
  rather than accepting free text, so create options and filter options never
  drift apart.
  The API and `ProductSortField` type also allow sorting by name; the dashboard UI
  intentionally exposes only price and createdAt, to keep the composite index set
  small and deliberate rather than indexing every field speculatively (see the
  README's Indexing strategy section).
- At least two summary metrics: total products, active count, revenue total. These
  reflect the entire catalog and are independent of the list's active filters.
  Revenue total sums the price of active products only (a proxy for sellable
  catalog value, since there is no sales/order data to compute true revenue from —
  see the README's Summary metrics section).
- Clean, usable UI. Functional over decorative.

### 2.4 Database design
- Firestore data model as specified in section 3.
- Provide `firestore.rules` and `firestore.indexes.json`.

---

## 3. Data model

```
products/{productId}            (auto-generated id)
  name: string
  category: string               (one of a fixed set — see below)
  price: number                 (integer or float; document as a plain number)
  status: "active" | "inactive"
  createdAt: Timestamp
  updatedAt: Timestamp

users/{uid}                     (id = Firebase Auth uid)
  email: string
  role: "admin" | "viewer"
  createdAt: Timestamp
```

- `category` is constrained to a fixed, hardcoded list (`PRODUCT_CATEGORIES` in
  `types/product.ts`), not free text, and is validated as an enum by the Zod
  schema. See the README's Database design (Categories) section for the rationale
  and the escalation path to a managed `categories` collection.
- Do NOT add `tenantId`, `createdBy`, or ownership fields. These are documented as
  future extensions only.
- Keep both collections flat and top level.

---

## 4. Backend layering (strict)

Three layers. Data flows one direction. Enforce the boundaries.

**Repository — `lib/repositories/productRepository.ts`**
- The ONLY file allowed to import Firestore / the Admin Firestore instance for
  products.
- Methods: `findAll(filters)`, `findById(id)`, `create(data)`, `update(id, data)`,
  `remove(id)`.
- `findAll` accepts `{ status?, category?, sortBy?, direction? }` and builds the
  query conditionally.
- Unwrap snapshots: return plain objects `{ id, ...data }`. Never return a
  Firestore snapshot. `findById` returns `null` when not found.
- Set `createdAt`/`updatedAt` here (or in the service — pick one place and be
  consistent; document the choice).

**Service — `lib/services/productService.ts`**
- No Firestore imports. No HTTP. Calls the repository only.
- `listProducts(filters)`, `createProduct(input)`, `updateProduct(id, input)`,
  `deleteProduct(id)`.
- Validates input with the Zod schema, applies defaults (status defaults to
  `active`), validates `category` against the fixed `PRODUCT_CATEGORIES` enum, and
  checks existence before update (throw `NotFoundError`).

**Route handlers — `app/api/products/route.ts` and `app/api/products/[id]/route.ts`**
- No business logic. No Firestore imports.
- Each handler: run the auth gate, check role for writes, parse the request, call
  the service, shape the response, map errors to status codes.

**Auth gate (server) — `lib/auth/server/middleware.ts`**
- Runs on the SERVER only. Imports the Admin SDK. Add `import "server-only"` at the
  top so an accidental client import fails the build.
- `requireAuth(req)`: extract the Bearer token, verify it with
  `adminAuth.verifyIdToken`, return `{ user }` or `{ error: 401 }`. Verify, never
  manually decode.
- `requireRole(user, role)`: return 403 if the user's claim role does not match.
- Use these at the top of every protected handler. Do not duplicate verification
  logic in handlers.

**Session helper (client) — `lib/auth/client/session.ts`**
- Runs in the BROWSER only. Imports the client SDK.
- `getToken()`: returns a fresh ID token via `currentUser.getIdToken()`, or `null`
  if signed out. Used by client hooks to attach `Authorization: Bearer <token>` to
  every API call.
- `getCurrentUser()`: returns the current Firebase user.

Note on layering: `lib/auth/server/` and `lib/auth/client/` are split by execution
environment on purpose. Folder location does not decide client vs server in
Next.js; imports and usage do. The split plus `server-only` makes the boundary
explicit and prevents leaking the Admin SDK into the browser.

**Endpoints and required roles**
```
GET    /api/products        list (filter/sort via query params)   admin, viewer
POST   /api/products        create                                admin only
GET    /api/products/:id    read one                              admin, viewer
PUT    /api/products/:id    update                                admin only
DELETE /api/products/:id    delete                                admin only
```

**Errors — `lib/errors/index.ts`**
- Define `AppError`, `NotFoundError`, `ValidationError`.
- A single `handleError(e)` maps error types to status codes (404, 400, else 500)
  and returns a generic message. Route handlers call it in their catch blocks.

---

## 5. Security rules and indexes

- `firestore.rules`: authenticated reads for signed in users; writes to `products`
  only when the token's role claim is `admin`. Rules are a backstop; the API is the
  primary gate. Write rules that reference `request.auth.token.role`.
- `firestore.indexes.json`: the dashboard's status and category filters are
  independent and combinable, and each can pair with a sort on `price` or
  `createdAt` in either direction. Firestore requires a composite index for every
  equality-filter-plus-sort combination, and a separate index per sort direction
  (composite indexes, unlike single-field indexes, don't serve both directions from
  one entry). `firestore.indexes.json` defines one index per reachable combination
  — see the README's Indexing strategy section for the full set and rationale.

---

## 6. Frontend

- **Pages:** `login`, `signup`, `dashboard` (protected), landing that redirects by
  auth state. Optionally group `login`/`signup` under a `(auth)` route group with a
  shared `layout.tsx`; the parentheses keep the group out of the URL (`/login`, not
  `/auth/login`). This is a nicety, not required.
- **`lib/auth/client/session.ts`:** client token helper (`getToken`,
  `getCurrentUser`), used by hooks to attach a fresh token to each API call.
- **`hooks/useAuth.ts`:** exposes current user and role via context, so any
  component can read auth state without re-reading Firebase. Justified independently
  of the product API, since role drives conditional UI across pages.
- **`hooks/useProducts.ts`:** the single client side place that calls the product
  API (list, create, update, delete), owning loading/error/data state. Justified by
  four CRUD operations that would otherwise duplicate fetch + token + error plumbing
  across components. Components do not fetch directly.

Routing model: `app/api/<resource>/route.ts` handles the collection path; a nested
`[id]/route.ts` handles the item path. HTTP methods are named exports (`GET`,
`POST`, `PUT`, `DELETE`) inside one `route.ts`, not separate files. `[id]` (square
brackets) is a dynamic URL segment read via the handler's `params`.
- **Components (grouped by feature, presentational):**
  - `components/products/ProductList.tsx` — table + filter/sort controls.
  - `components/products/ProductForm.tsx` — create/edit form, admin only.
  - `components/products/ProductRow.tsx` — one row; hides edit/delete for viewers.
  - `components/dashboard/MetricsBar.tsx` — the summary metrics.
  - `components/ui/` — small shared presentational pieces only.
- Role drives which controls render (UX). The server still enforces
  authorization independently.
- Responsive layout. Accessible markup: labelled inputs, semantic table, buttons
  with accessible names, keyboard usable.

---

## 7. Types — `types/product.ts`
- Export `Product`, `ProductInput`, `Role`, `PRODUCT_CATEGORIES` /
  `ProductCategory` (the fixed category list and its derived type), and any
  filter/sort param types.
- The same `Product` type is used by the repository, service, API, and UI.

---

## 8. Scripts and config

- `scripts/setAdmin.ts`: takes an email arg, looks up the user, sets custom claim
  `{ role: "admin" }`, and syncs the `users/{uid}.role` field. Exposed as
  `npm run set-admin -- <email>`.
- `lib/firebase/client.ts`: client SDK init from public env vars.
- `lib/firebase/admin.ts`: Admin SDK init from three service account env vars
  (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
  `FIREBASE_ADMIN_PRIVATE_KEY`), copied out of the downloaded JSON rather than the
  JSON file itself. Server only. Guard against re-initialization in dev hot reload.
- `.env.example`: document every required env var. `.env.local` is gitignored.

---

## 9. Dependencies (allowed set)

Required: `next`, `react`, `react-dom`, `firebase`, `firebase-admin`, `zod`,
`tailwindcss`, `typescript`, and type packages.

Do not add: any state management library (use React state + hooks), any ORM, any UI
component kit, any auth library beyond the Firebase SDKs, CQRS/event libraries. If
another dependency seems needed, add a short note in the README explaining why.

---

## 10. Explicitly out of scope (document, do not build)

These are future extensions. Leave clean seams (as described) but do NOT implement:
- Multi-tenancy (`tenantId` on products, tenant claims, tenant scoped rules,
  memberships collection).
- Precomputed metrics aggregate (`stats/products` transactional counter).
- Cursor based pagination and search.
- AI feature (product description generation or natural language search).
- CI/CD workflow and observability tooling.
- Product ownership / `createdBy`.
- A managed `categories` collection (admin-editable categories with metadata like
  display order or a description). Categories are a fixed, hardcoded list for this
  scope; see the README's Database design (Categories) section for the escalation
  path.

Each of these must be mentioned in the README's "What's next" or scaling sections
with a one line note on how it would slot into the existing layers.

---

## 9a. Testing approach

Tests are NOT required by the assignment (only a bonus CI workflow references running
them). The priority is testable structure, not coverage. No test suite is built for
this submission — core features and documentation are prioritized within the
timeline, and this is documented in the README rather than implemented.

- The code must be structured to be testable. Because Firestore is isolated in the
  repository, services can be tested by injecting a fake repository with no real
  database. This costs nothing and is the main signal, and it holds whether or not a
  test suite is actually written.
- The README documents, rather than implements, what testing would look like with
  more time: service-level tests (business rules, validation), route-level tests
  (auth and status codes), component tests (rendering, role-based controls), and a
  small CI workflow to run them on every push.
- Do not add `vitest` or any other test dependency for this build.

---

## 11. Definition of done

- All five product endpoints work and enforce roles on the server.
- A viewer holding a valid token cannot create/update/delete via a direct API call
  (returns 403), independent of the UI.
- Dashboard lists products with working filter and sort and shows the three metrics.
- `firestore.rules` and `firestore.indexes.json` are present and consistent with the
  queries used.
- `npm run set-admin -- <email>` promotes a user.
- README is complete: setup, architecture, schema, security, trade-offs, what's
  next, AI usage.
- No Firestore import exists outside `lib/repositories` and `lib/firebase`.
- No business logic exists inside route handlers.
