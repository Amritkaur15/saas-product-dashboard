# Mini SaaS Product Management Dashboard

A small SaaS dashboard where authenticated users manage products, view summary
metrics, and access is controlled by role. Built with Next.js, Firebase Auth,
and Firestore, with a clean layered Node.js backend.

The goal of this build is not feature completeness. It is to show clear
separation of concerns, correct server side security, a sensible data model,
and honest reasoning about where the design would go under more load. Anything
not built fully is explained below.

---

## Run the app

- **Locally:** follow the Setup section below (about 5 minutes). This is the primary
  way to run the project.
- **Hosted demo:** _(optional — add a Vercel URL here if deployed, otherwise remove
  this line.)_

---

## Setup (run locally in under 5 minutes)

### Prerequisites

- **Node.js 24 LTS** (or any current LTS; Node 18 and 20 are end-of-life). Check with `node -v`.
- **A Google account**, used to sign in to Firebase.
- **A Firebase project** (free Spark plan is enough). See the one-time setup below.
- Git, to clone the repo.

Built with: Next.js 16 (App Router), React 19, TypeScript 5, Firebase (modular client
SDK) and Firebase Admin SDK, Zod, Tailwind CSS v3.4. Exact versions are pinned in
`package.json` and the committed lockfile.

### One-time Firebase project setup

If you do not already have a Firebase project for this app:

1. Go to the [Firebase console](https://console.firebase.google.com) and create a
   new project.
2. In **Build > Authentication**, click Get started and enable the
   **Email/Password** sign-in provider.
3. In **Build > Firestore Database**, create a database (start in production mode;
   the app ships its own security rules).
4. Get the **client web config**: Project settings > General > Your apps > add a Web
   app, and copy the config values (apiKey, authDomain, projectId, etc.).
5. Get a **server service account**: Project settings > Service accounts > Generate
   new private key. This downloads a JSON file. It is a secret. Do not commit it.

### Run it

1. Clone the repo and install:
   ```bash
   git clone <repo-url>
   cd <repo>
   npm install
   ```
2. Create `.env.local` from the template and fill in your Firebase values:
   ```bash
   cp .env.example .env.local
   ```
   Use the client web config for the `NEXT_PUBLIC_*` values. For the Admin SDK, open
   the downloaded service account JSON and copy three fields into their own
   variables: `project_id` -> `FIREBASE_ADMIN_PROJECT_ID`, `client_email` ->
   `FIREBASE_ADMIN_CLIENT_EMAIL`, `private_key` -> `FIREBASE_ADMIN_PRIVATE_KEY`
   (keep its `\n` escapes as-is; they're restored to real newlines at runtime).
   These three values are used only by the Admin SDK on the server and must never
   be committed. The JSON file itself is not read directly and must never be
   committed either.
3. Start the app and sign up once through the UI:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 and create an account (it will be a viewer).
4. Promote that account to admin so you can see the admin controls:
   ```bash
   npm run set-admin -- someone@example.com
   ```
   Sign out and back in (or wait for the token to refresh) for the new role to take
   effect.

### Deploying Firestore rules and indexes

This is only needed if you're running against your own Firebase project. It is not
needed to use the hosted app or the project already configured for this build,
where the rules and indexes are already deployed.

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # select your Firebase project
firebase deploy --only firestore:indexes,firestore:rules
```

`firestore.rules`, `firestore.indexes.json`, `firebase.json`, and `.firebaserc` are
all committed, so this recreates the exact rules and index setup with no manual
configuration in the console.

Composite indexes take a minute or two to build after deploying. Queries that need
one will fail until it finishes.

No environment variables are needed for this. The CLI authenticates with its own
browser based Google login, separate from the app's runtime credentials in
`.env.local`.

---

## Architecture overview

This is a single Next.js project rather than a separate frontend and backend. The
Node.js API is the server side code inside this same project: the `app/api` route
handlers plus `lib/services`, `lib/repositories`, `lib/auth/server`, and
`lib/firebase/admin` all run in Node.js on the server. The React pages under `app`
and the `components` run in the browser. One repository, separated by execution
environment, not by being two deployables.

The backend is organized into layers, each with a single responsibility. Data
flows in one direction, and each layer only knows about the layer directly below
it.

```
Request
  -> Route handler (app/api)      HTTP concerns: parse request, check auth, shape response
  -> Service (lib/services)       Business rules: validation, defaults, orchestration
  -> Repository (lib/repositories) Data access: the ONLY code that knows Firestore exists
  -> Firestore
```

The most important rule in the design: **only the repository layer touches
Firestore.** Route handlers and services never contain a Firestore call. They
call methods like `productRepository.findAll()` and receive plain objects back.
This means a schema change, a database swap, or a test mock touches one file
instead of rippling through the codebase.

Key folders:

- `app/api` — thin route handlers. HTTP and auth only, then delegate to a service.
- `lib/firebase` — Firebase client and Admin SDK initialization.
- `lib/auth/server` — the server auth gate (token verification and role checks), Admin SDK.
- `lib/auth/client` — the client session helper (fresh token for API calls), client SDK.
- `lib/repositories` — data access. The only Firestore aware code.
- `lib/services` — business logic, validation, and defaults.
- `lib/errors` — typed application errors and a mapper to HTTP status codes.
- `components` — presentational React components grouped by feature.
- `hooks` — client side data fetching, so components stay declarative.
- `types` — shared TypeScript types used front to back.

Adding a new entity later (for example orders) means adding a repository and a
service following the same pattern. Nothing existing changes. That is the
"open to extension" property the structure is designed for.

---

## Security and authentication

**Overview**

Authentication uses Firebase Auth. Authorization uses two roles, admin and
viewer, enforced on the server. The client hides controls based on role for a
clean experience, but every protected API route independently verifies the
caller and their role. Hiding UI is treated as UX, not security.

**How a request flows**

1. The user signs in with Firebase Auth on the client. Firebase issues a signed
   ID token (a JWT valid for one hour).
2. The client attaches the token to every API call as
   `Authorization: Bearer <token>`. It fetches a fresh token with
   `getIdToken()` before each call, so the token is never stale. The Firebase
   client SDK refreshes tokens automatically in the background.
3. Each protected API route runs a shared auth check before any business logic.
   It extracts the token, verifies it with the Firebase Admin SDK, and reads the
   user's role from the token's custom claims.
4. If the token is missing or invalid, the API returns 401. If the role is not
   allowed for the action, it returns 403. Only after both checks pass does the
   route reach the service and touch Firestore.

**Why verify instead of decode**

A JWT payload is base64 text that anyone can read or forge. It is signed, not
encrypted. What proves a token is genuine is its signature, which only Firebase
can produce with its private key. The server verifies that signature with the
Admin SDK. Decoding would only read the claims without proving they are
authentic, so decoding alone is never trusted.

**Roles and custom claims**

Roles are stored as Firebase custom claims, set from trusted server code with the
Admin SDK. Claims ride inside the verified token, so the API reads the role
without an extra database read per request. A matching `role` field is also kept
in the `users` collection for display and for Security Rules to reference.

New users default to the viewer role. Admins are granted by running a seed script
(`npm run set-admin -- <email>`) that calls `setCustomUserClaims`. Admin is never
self serve, since privilege changes must come from trusted server code, not the
client.

Trade-off: custom claims only update when the token refreshes, so a role change
can take up to an hour to take effect unless the token is force refreshed with
`getIdToken(true)`. This was an acceptable trade for a stateless, scalable auth
model. Instant revocation would require a per request lookup, which was not added.

**Layers of enforcement (defense in depth)**

- Client: hides admin controls from viewers. UX only, not relied on for security.
- API: verifies the token and enforces role on every protected route. This is the
  real gate.
- Firestore Security Rules: a final backstop so that even a direct client side
  database call cannot bypass role restrictions.

**OWASP basics**

- No tokens or sensitive identifiers in URLs. Tokens travel in the Authorization
  header.
- The Admin SDK service account key is kept in an environment variable and is
  gitignored. It is never shipped to the client.
- API errors return generic messages and correct status codes (401 / 403 / 400 / 404) without leaking internal details.
- All privileged operations (token verification, role assignment) run only on the
  server with the Admin SDK.

---

## Database design

**Overview**

The app uses Firestore, a NoSQL document store. Data is modeled around the queries
the app actually runs, a product list with filtering and sorting and a few
summary metrics, rather than around relational normalization, since Firestore has
no joins. The result is two flat top level collections.

**Collections and documents**

```
products/                          (collection)
  {productId}/                     (auto-generated document ID)
    name: string
    category: string
    price: number
    status: "active" | "inactive"
    createdAt: timestamp
    updatedAt: timestamp

users/                             (collection)
  {uid}/                           (document ID = Firebase Auth uid)
    email: string
    role: "admin" | "viewer"
    createdAt: timestamp
```

**Design decisions**

- Product IDs are auto generated. Products have no natural unique key (two
  products can share a name), so generated IDs are correct.
- User documents use the Firebase Auth uid as the document ID, making "fetch the
  current user's record" a direct lookup with no query.
- `price` is a number so it can be summed for the revenue metric and sorted in the
  dashboard. In production I would store money as an integer number of minor units
  (cents) to avoid floating point rounding, since decimal placement is a fixed
  property of the currency. For this scope a plain number is sufficient.
- Two timestamps are kept. `createdAt` satisfies the required timestamp and
  supports "recently added" sorting. `updatedAt` is set on every edit, which the
  update operation naturally produces.

**Products are a shared pool**

The spec does not define per user product ownership, so products are a single
shared collection that admins manage and viewers read. I deliberately did not nest
products under users or add an owner field, since no in scope feature reads it. If
ownership were needed, I would add a `createdBy` field holding the creator's uid
and query it with `where("createdBy", "==", uid)`.

**Categories**

Categories are a fixed, hardcoded list (`PRODUCT_CATEGORIES` in `types/product.ts`),
not free text. Both the create/edit form and the dashboard's category filter read
from this single list, so the two never drift apart. This was chosen over a
free-text field to prevent inconsistent values (for example "cloth" vs "clothing")
that would silently fragment filtering — free text looks fine until two admins
spell the same category differently and neither filter finds all the matching
products. The Zod schema validates `category` as an enum of the allowed values, so
even a direct API call bypassing the UI cannot write an arbitrary category.

Escalation path: if categories needed to be managed by non-developers without a
redeploy, or needed metadata like display order or a description, they would move
into a dedicated `categories` collection in Firestore, with the dropdown populated
from it and a small admin UI to manage entries. Kept as a hardcoded list for this
scope, since a managed categories collection would add its own CRUD surface
(repository, service, routes) that isn't justified yet.

**Indexing strategy**

The guiding principle is that indexes follow the queries the dashboard actually
issues, rather than indexing every field speculatively. Indexes are not free:
every index must be updated on each write, so more indexes mean slower writes and
more storage. The set below is therefore kept intentional, balancing read
flexibility against write cost.

Single-field indexes are created automatically by Firestore for every field, in
both sort directions. These cover the simple queries: filtering by status alone,
filtering by category alone, or sorting by a single field with no filter.

Composite indexes are required only when a query combines a filter and a sort on a
different field, which the dashboard does (a status or category filter together
with a sort). Firestore does not create these automatically; the query fails with
a link to create the exact index needed. Unlike single-field indexes, a composite
index does not serve both sort directions from one entry, so each supported
filter-plus-sort combination has a separate ascending and descending index.

To keep the index set intentional, the dashboard sorts by `price` or `createdAt`
(the two meaningful product sorts) rather than every field, and supports status and
category filters. The composite indexes in `firestore.indexes.json` map one to one
to those supported combinations. Adding another sortable field or filter would add
its own composite indexes, which is the deliberate trade being made: the query
surface is kept focused so the index set stays small and writes stay cheap.

Firestore query performance scales with the size of the result set, not the size
of the collection, because every query is served from an index rather than by
scanning documents. The dashboard currently reads the full filtered result set on
each load, which is fine at this catalog size; see Pagination below for the
scaling path once that stops being true.

**Summary metrics**

The metrics (total products, active count, revenue total) are computed server-side
by `GET /api/products/metrics`, which reads the products collection directly and
reduces over it. At this scale that is simple and correct.

The metrics reflect the entire catalog and are independent of the dashboard's list
filters — the metrics endpoint always reads the full, unfiltered collection,
separately from the (possibly filtered) request the product table makes.

Revenue total sums the price of active products only, not all products. This app
has no sales or order data (units sold), so there is no true revenue figure to
compute; the metric is a proxy for sellable catalog value / revenue potential
instead. Inactive products aren't sellable, so summing only active prices avoids
overstating that potential — an inactive product's price shouldn't count toward
what the catalog could actually earn.

At 10x or 100x the data this would not hold, because Firestore bills per document
read and reading every product on every metrics request becomes slow and costly.
The scaling path is a precomputed aggregate: a single `stats/products` document
holding `{ total, activeCount, revenueTotal }`, updated on every product write
inside a transaction so the counters never drift. The metrics endpoint would then
read one document instead of the whole collection. The trade-off is added write
complexity, and an asynchronous updater (a Cloud Function) would make the totals
eventually consistent. This was not built, since it is unnecessary at the current
scale.

**Pagination**

For large collections the list would use cursor based pagination
(`startAfter(lastDoc)`) rather than offset. Offset charges for skipped documents,
making deep paging linearly slower and costlier, whereas a cursor jumps directly
to the next page in constant time. The trade-off is that cursors support next and
previous navigation rather than jumping to an arbitrary page number, which suits a
product list well.

**Scaling to multi-tenancy**

The current model is single tenant. To support multiple isolated organizations:

- Add a `tenantId` field to every product.
- Add `tenantId` to each user's custom claims, so it travels inside the auth token
  alongside the role.
- Enforce isolation in Security Rules by requiring the token's tenantId to match
  the document's tenantId, so a user can never read or write another tenant's data
  even through a direct database call.
- Scope every product query with `where("tenantId", "==", currentTenant)`.

Roles would become per tenant. If each user belongs to exactly one tenant, a single
`tenantId` claim is enough. If a user can belong to multiple tenants with different
roles, I would introduce a `memberships` collection with one document per
(uid, tenantId, role) combination, with the active tenant selected in the UI. I
would also consider nesting products under `tenants/{tenantId}/products` for
stronger isolation, trading off cross tenant reporting.

---

## API and data access layer

Requirement 2 asks for a clean data access layer in Node.js. The backend
separates this into three layers.

**Repository (data access)** — the only Firestore aware code. It builds queries,
executes them, and unwraps Firestore snapshots into plain objects before returning
them. Nothing above it deals with `.data()`, `.exists`, or snapshot shapes.

**Service (business logic)** — validation, defaults (a new product defaults to
active), and existence checks (you cannot update a product that does not exist). It
knows about products as a concept, not about HTTP or Firestore.

**Route handler (HTTP + auth)** — verifies auth, checks role, parses the request,
calls the service, and shapes the HTTP response. It contains no business logic and
no Firestore calls.

Endpoints:

```
GET    /api/products          list with optional filter and sort   (admin, viewer)
POST   /api/products          create a product                     (admin only)
GET    /api/products/:id      read one product                     (admin, viewer)
PUT    /api/products/:id      update a product                     (admin only)
DELETE /api/products/:id      delete a product                     (admin only)
GET    /api/products/metrics  total/active count, revenue total    (admin, viewer)
```

Role enforcement lives at the route layer, since "who may call this endpoint" is
an HTTP concern, while "what makes a product valid" lives in the service.

---

## Testing

The code is structured to be testable: Firestore access is isolated in the
repository layer, so services can be unit tested by injecting a fake repository,
with no real database involved.

No test suite is included in this submission. Tests are a bonus here, not a core
requirement, so the time went into the core features and clear documentation
instead.

With more time I would add:

- Service-level tests for business rules and validation (for example, `createProduct`
  defaulting status to `active`, `updateProduct` throwing `NotFoundError` for a
  missing id).
- Route-level tests for auth and status codes (401 with no token, 403 for a viewer
  attempting a write, 404 for a missing product).
- Component tests for UI rendering and role-based controls (admin sees edit/delete,
  viewer does not).
- A small CI workflow that lints and runs the tests on every push.

---

## Frontend

- The dashboard is a protected page showing the product list with filter and sort
  controls plus summary metrics.
- Components are grouped by feature and kept presentational. Client side data
  fetching lives in hooks (`useProducts`, `useAuth`) so components stay
  declarative. `useProducts` owns loading, error, and data state for the four CRUD
  operations; `useAuth` exposes the current user and role via context.
- Each API call attaches a fresh token from the client session helper
  (`getToken()`), which the server gate then verifies. The client gets the token,
  the server verifies it.
- Admin users see create, edit, and delete controls. Viewers see a read only
  interface. This is UX only; the server independently enforces the same rules.
- Shared TypeScript types keep the product shape consistent from the API to the UI.
- State management uses React built-ins (`useState`, `useContext`) only. The state
  is small and local, so a state management library would be unjustified.

---

## Trade-offs and scope decisions

- Built single tenant. Multi-tenancy is described above as an evolution, not built,
  since the spec asks to explain it rather than implement it.
- Metrics are computed live by reading the collection. Correct at this scale; the
  precomputed aggregate is documented as the scaling path.
- Custom claims are used for roles, accepting up to one hour of staleness on a role
  change in exchange for a stateless, read free auth check.
- Kept the dependency set minimal: Next.js, React, Firebase client, Firebase Admin,
  and one small validation library. No state management library, ORM, or UI kit
  beyond styling.
- Categories are a fixed hardcoded list, not free text or a managed collection.
  Prevents inconsistent values and keeps filtering reliable; see Database design's
  Categories section above for the escalation path.

---

## What's next (with another week)

1. Cursor based pagination and search on the product list.
2. A precomputed metrics aggregate updated transactionally on write.
3. An AI feature (auto generated product descriptions or natural language search),
   productionized with server side rate limiting and input validation.
4. Basic observability: structured API logging and error tracking.
5. A test suite and CI workflow, described in the Testing section above.

---

## AI tool usage

AI tools were used to accelerate scaffolding, explore trade-offs, and draft
documentation. All architectural decisions, the layering, the security model, and
the data model were reasoned through and can be explained line by line.
