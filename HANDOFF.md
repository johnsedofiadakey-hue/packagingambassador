# Packaging Ambassadors — Project Handoff

Last updated: 2026-07-20. Read this before touching the codebase — it explains what exists, why it's
built the way it is, and what's still missing. This is a living document; keep it updated as the
project changes so the next session (human or AI) doesn't have to reconstruct context from scratch.

## What this is

An e-commerce storefront + admin portal for **Packaging Ambassadors**, a Ghana-based supplier of
kraft packaging (cups, boxes, bags, wraps, food containers). Built by STORMGLIDE (the developer's own
shop) under a signed service agreement for client Packaging Ambassadors Ltd. Originally modeled on a
reference site (a "PackVista" Shopify theme demo) for structure, then rebranded with the client's real
brand colors once their logo was provided.

**⚠ Not a standard Next.js version.** Per `AGENTS.md` at the repo root: this Next.js version has
breaking changes from training-data conventions (e.g. `middleware.ts` → `proxy.ts`, function `proxy`
not `middleware`, Node runtime by default not Edge). Check `node_modules/next/dist/docs/` before
writing Next-specific code and assuming old conventions apply.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000 (or next available port)
```

Requires `.env.local` (gitignored, not committed) with:
- `NEXT_PUBLIC_FIREBASE_*` (6 vars) — Firebase project config, already set up for this project.
- `ARKESEL_API_KEY`, `RESEND_API_KEY` — server-only, currently **blank placeholders**. SMS/email
  notifications silently no-op until these are filled in with real provider keys.

**Admin login**: `/admin/login`. The first admin account (Firebase Auth user + matching `staff/{uid}`
Firestore doc with `role: "Admin"`, `active: true`) was created manually via the Firebase console —
there's no self-serve bootstrap flow in the app itself. Ask the project owner for credentials, or if
setting up a fresh Firebase project, create that first admin manually before anything else works.

## Tech stack

Next.js 16.2.10 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · Firebase (Auth,
Firestore, Storage) · Framer Motion · lucide-react · clsx. No test framework, no CI configured.

## Architecture

- **`src/app/(site)/`** — all customer-facing pages (home, `/shop`, `/category/[slug]`,
  `/product/[slug]`, `/cart`, `/about`, `/contact`, `/blog`, `/blog/[slug]`), wrapped by
  `(site)/layout.tsx` which renders `PromoBar` → `Header` → page → `Footer`, inside `CartProvider`.
- **`src/app/admin/`** — the admin portal, separate chrome from the storefront.
  - `/admin/login` — Firebase Auth email/password sign-in (`LoginForm.tsx`).
  - `/admin/(dashboard)/*` — dashboard, products, categories, orders, staff, settings. Guarded
    client-side: `(dashboard)/layout.tsx` uses `useCurrentStaff()` and redirects to `/admin/login` in a
    `useEffect` if the signed-in user has no active `staff` doc. **There is no `proxy.ts`/middleware
    guard** — an earlier plan considered one, but the shipped implementation is the client-side
    redirect described above.
  - No admin link in the main customer nav — the only entry point is a small, low-opacity "Staff
    Login" link in the footer (bottom-right).
- **`src/app/api/notifications/order-confirmation/route.ts`** — the only server API route in the app.
  Everything else is client components talking to Firestore directly via the client SDK.
- Root `src/app/layout.tsx` holds only fonts, `globals.css`, and `AdminDataProvider` — no
  Header/Footer there (those are `(site)`-scoped only, so the admin portal doesn't get storefront
  chrome).

## Data layer — real Firebase, not localStorage

This is the most important thing to get right if you're continuing work here: an **earlier plan
described a localStorage-only prototype data layer — that was superseded**. The shipped implementation
is real Firestore, live and multi-user:

- `src/lib/firebase.ts` — initializes the Firebase app from `NEXT_PUBLIC_FIREBASE_*` env vars, exports
  `auth`/`db`/`storage`, plus `getSecondaryAuth()` (a second named Firebase app instance used only so
  creating a new staff account doesn't hijack the acting admin's own session).
- `src/lib/store.tsx` — `AdminDataProvider` / `useAdminData()` is the single shared source of truth.
  Subscribes to Firestore collections (`products`, `categories`, `orders`, `staff`, `settings/store`)
  with real-time `onSnapshot` listeners. Every admin CRUD action (`addProduct`, `updateOrderStatus`,
  etc.) is a direct Firestore write — no server API layer in between except where noted above.
- `src/lib/cart-context.tsx` — the customer's shopping cart. Separate from the admin data layer,
  `localStorage`-backed (`pa-cart` key), site-only. This one genuinely is local/per-browser, by design.
- `src/lib/useCurrentStaff.ts` — resolves the signed-in Firebase Auth user to their `staff/{uid}`
  Firestore doc (role, active flag). Used for the admin route guard and role-based nav filtering.
- `firestore.rules` (repo root, **not yet confirmed deployed** — see Known Gaps) — the real
  authorization boundary. Products/categories: public read, staff-write. Orders: anyone can `create`
  (guest checkout), only staff can read/update/delete. Staff/settings: staff-only read, admin-only
  write.
- `storage.rules` (repo root, **not yet confirmed deployed**) — governs Firebase Storage uploads
  (product photos under `products/`, hero photo under `hero/`). If photo uploads fail with a
  permission error, this is almost certainly why — it needs to be pasted into the Firebase console.

## Design system

- **Colors** (`src/app/globals.css`, Tailwind v4 `@theme inline` tokens): `sand-*` (warm cream/tan,
  primary surface), `ink-*` (warm charcoal, default text), `amber-*` (gold, primary CTA color),
  `forest-*` (green — deliberately limited to ~4 accent spots: footer, homepage brand-story section,
  About page trust banner, "Eco-Friendly" badge — not the default text color, don't let it creep back
  into primary chrome), `clay-*` (terracotta), `sunset-*` (vivid orange, newest addition — used
  sparingly for the logo mark circle and the "New" product badge only, not a general-purpose color).
  All of these were retuned on 2026-07-20 to blend toward the client's actual logo colors (brown/
  green/gold/orange) — see Session History below. The retuning was deliberately kept "refined" rather
  than matching the logo's full poster-saturation, per an explicit user choice.
- **Fonts**: Inter (body, `--font-inter`/`--font-sans`) + Plus Jakarta Sans (headings,
  `--font-jakarta`/`--font-display`). This *replaced* an earlier Fraunces-serif choice — if you see
  Fraunces referenced anywhere, it's stale.
- **Logo**: the client's real logo image has **not been added to the repo yet**. The header/footer/
  admin-login/admin-dashboard "mark" is currently a placeholder — a Leaf icon (lucide-react) in a
  `sunset-500` circle — standing in for the real logo until the client drops the actual file into
  `public/` and someone swaps the `<span>` icon treatment for an `<img>`. Search for `bg-sunset-500`
  wrapping a `<Leaf` icon to find every spot that needs updating once the file exists.
- **Product imagery**: no real product photography by design. `src/components/ProductArt.tsx` renders
  custom isometric-style SVG illustrations per category (cup/box/bag/wrap/container), used as a
  fallback whenever a product has no uploaded `image`. This was an intentional choice, not a
  placeholder-because-lazy — don't "fix" it by sourcing stock photos without asking.
- **Animation**: Framer Motion (a real dependency, chosen deliberately over a dependency-free CSS
  approach when asked). `src/components/Reveal.tsx` (scroll-triggered fade+slide-up),
  `src/components/MotionLink.tsx` (`motion.create(Link)` — reuse this instead of writing a new
  `motion.create(Link)` per file), `src/components/CountUp.tsx` (animated number count-up, parses a
  string like `"2,000+"` into a numeric target + suffix).

## Feature inventory

### Storefront (customer-facing)
- Home, shop/category catalogue with search + sort + category/price filters
  (`ShopCatalogue.tsx`), product detail with color/size/quantity selection, cart with real guest
  checkout (writes an `orders` doc to Firestore, no login required).
- **Discount pricing**: `Product.compareAtPrice` (optional) — when set above `price`, shows a
  struck-through original price + a green "-X%" pill. Helper: `getDiscountPercent()` in
  `src/lib/utils.ts`.
- **Site-wide promotion banner**: `PromoBar.tsx`, driven by `settings.promotion` in Firestore
  (`enabled`/`text`/`ctaLabel`/`ctaHref`). Off by default. Dismissible per page-view (no persistence).
- **Best Sellers** (homepage): `src/lib/top-sellers.ts`'s `getTopSellers()` aggregates real quantities
  sold from non-cancelled `orders`, falls back to admin-tagged `"Best Seller"`-badged products when
  there's no order history yet, falls back further to a plain slice so the section is never empty.
  This replaced an earlier arbitrary `products.slice(0, 4)` "Featured Products" section.
- Blog (`/blog`, `/blog/[slug]`) — **static content only**, from `src/lib/posts.ts`. Not admin-
  editable, unlike everything else. A real gap if blog content needs to change often (see Known Gaps).
- Real order-confirmation SMS (Arkesel) + email (Resend) fire after checkout — see API route above.
  Best-effort: a failure here never blocks checkout from succeeding.
- No customer accounts — deliberately removed. The `/account` page and its header nav icon existed
  briefly as a non-functional mockup and were deleted; don't recreate without being asked. Staff/admin
  login via Firebase Auth is the only auth the site has.

### Admin portal (`/admin`)
- Dashboard: revenue/order/stock summary cards, recent orders, low-stock warnings, and a **"Seed
  Sample Catalog" banner** (auto-hides once any category exists) that one-click-populates Firestore
  from the original 6 sample products / 5 categories in `src/lib/products.ts` — useful for a fresh
  Firebase project or a demo, not meant to represent real inventory long-term.
- Products: full CRUD, client-side photo upload (data-URL → Firebase Storage), **bulk CSV import**
  (`ImportCsvModal.tsx` + `src/lib/csv.ts` — dependency-free CSV parser, per-row validation preview,
  "download template" button). Column contract documented in `csv.ts`.
- Categories: CRUD, manual reordering, delete-guard if products are still assigned.
- Orders: status pipeline (Pending/Processing/Delivered/Cancelled), fed by the real guest-checkout flow.
- Staff: CRUD with role field (Admin/Sales Staff/Inventory Staff) — `addStaff` creates a *real* Firebase
  Auth account via the secondary-app trick, so anyone added through this UI can actually log in.
- Settings tabs: General, **Hero & Homepage** (controls the homepage hero copy/CTAs/stat + photo
  upload), **Promotion** (the sitewide banner above), Payment (Paystack keys — storage-only, not wired
  to real payment processing yet), Notifications (SMS/email provider *config* — sender name, from
  address; **actual API keys live in server env vars, not here**, see below), Account (change password
  for the signed-in staff member).

## Notifications (SMS + email)

Real sending is wired (`src/app/api/notifications/order-confirmation/route.ts`), targeting **Arkesel**
for SMS and **Resend** for email — chosen deliberately over Hubtel/SendGrid when asked. Triggered from
`(site)/cart/page.tsx` right after a successful `addOrder()`. Behavior:
- Missing `ARKESEL_API_KEY` or `RESEND_API_KEY` → that channel is skipped silently (server-side
  console warning only), checkout still succeeds either way.
- Customer gets an SMS + email confirmation; the store's own `storeEmail` (from Settings → General)
  also gets a copy of the order email.
- **Untested against real accounts** — the Arkesel request shape in particular may need a small
  adjustment once there's a real Arkesel account to test against; I built it against their documented
  v2 API but couldn't verify live delivery.
- The old Firestore-stored `smsApiKey`/`emailApiKey` settings fields were **deliberately removed**
  (they'd have been readable by any signed-in staff account — real secrets never belong there). If you
  see references to them anywhere, that's stale.

## Known gaps (honest, prioritized)

**Should do before this is a real, live store:**
1. **Payments aren't real.** Checkout logs a "Pending" order; nothing actually charges the customer.
   Paystack fields in Settings are stored config only, with an on-page warning. This is the single
   biggest gap between what exists and a functioning store.
2. **Nothing is committed to git.** Still only 2 commits total ("Initial commit from Create Next App"
   + one early rebrand commit). Everything since — the entire admin portal, Firebase integration,
   all of this session's work — is uncommitted in the working tree. Ask before committing (per this
   project's working style so far, commits happen only when explicitly requested) but flag the risk.
3. **`firestore.rules` / `storage.rules` deployment status is unconfirmed.** The files exist in the
   repo but whether they've actually been pasted into the Firebase console (Firestore Rules tab /
   Storage Rules tab) hasn't been verified in this session. If product/hero photo uploads or writes
   fail with permission errors, check this first.

**Real features still missing or incomplete:**
4. **Blog isn't admin-editable** — static `src/lib/posts.ts`, inconsistent with the rest of the
   Firestore-backed admin portal.
5. **Catalog is thin** — only the 6 original sample products / 5 categories exist by default. The CSV
   bulk-import tool exists now specifically to make adding real inventory fast once the client has a
   product list ready.
6. **Real logo asset not in the repo** — see Design System above.
7. `CategoryCarousel` and a few other polish items were being tracked as "leftover from last session"
   items and got closed out as of 2026-07-20 — if a new leftover list starts accumulating, keep it
   honest the same way (don't silently drop things you said you'd do).

**Needs a real person to click through and verify** (things that couldn't be tested without an
authenticated admin session or real provider credentials): hero photo upload end-to-end, promotion
banner toggle, discount pricing display, best-sellers shifting after a real order, CSV import against
a real spreadsheet, actual SMS/email delivery.

## Gotchas

- **Turbopack dev-server cache can get stuck** showing a stale parse error for a file that's actually
  fine on disk (confirmed via `npx tsc --noEmit` + `npm run build` both passing clean while the dev
  server's browser console still showed an old error). If this happens, restart the dev server
  (`Ctrl+C` then `npm run dev` again) — don't trust a stuck dev-server error over a fresh
  build/typecheck.
- `.gitignore` has a stale comment referencing `src/lib/admin-auth.ts` for the `/.data` ignore rule —
  that file doesn't exist (an earlier scrypt/HMAC-cookie auth plan was superseded by real Firebase
  Auth, see Data Layer above). Harmless, but don't go looking for `admin-auth.ts`.
- This repo has been worked on across multiple sessions with significant context compression in
  between — if something referenced in an old memory/plan doesn't match what's actually on disk,
  **trust the disk**, not the memory. This file exists specifically to reduce how often that happens
  going forward; keep it updated.

## Session history (chronological, high-level)

1. **Initial build** — scaffolded from `create-next-app`, built a full clone of a reference "PackVista"
   storefront (warm green/amber palette, static product data, working localStorage cart).
2. **Admin portal + Firebase migration** — added `src/app/admin/`, real Firebase Auth + Firestore data
   layer (`store.tsx`, `firebase.ts`), rebranded to the current sand/ink/amber/forest palette (green
   demoted from default text color to ~4 intentional accents), switched Fraunces → Plus Jakarta Sans,
   added `HeroCollage`, `CategoryCarousel`, `/blog`.
3. **Firestore was empty** — found and fixed via the "Seed Sample Catalog" dashboard banner.
4. **Discounts, promotions, real best-sellers, animation pass** — `compareAtPrice`, `PromoBar` +
   Settings tab, `getTopSellers()`, Framer Motion (`Reveal`, `MotionLink`, `CountUp`, hover/tap
   micro-interactions), plus a general polish pass (empty states, focus rings, loading skeletons).
5. **Logo-driven rebrand + real notifications + CSV import** (2026-07-20, most recent) — client
   provided their actual logo; palette retuned to blend its brown/green/gold/orange in (refined, not
   full saturation); removed customer accounts entirely; built real SMS/email sending via Arkesel +
   Resend; built bulk CSV product import. This file was written at the end of this phase.
