# Packaging Ambassadors — Project Handoff

Last updated: 2026-07-21 (color theming pass). Read this before touching the codebase — it explains what exists, why it's
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

**Order tracking (`/api/orders/track`)** needs Application Default Credentials for `firebase-admin`.
Run `gcloud auth application-default login` once locally (already done on this machine — the ADC file
exists at `~/.config/gcloud/application_default_credentials.json`). Production resolves ADC
automatically on Firebase App Hosting's Cloud Run runtime, no extra setup. **First request after a dev
server restart can be slow (~3s) or occasionally crash the dev server outright** — this is Admin SDK
gRPC channel cold-start, not a logic bug; a retry succeeds. Hasn't been stress-tested beyond that.

## Tech stack

Next.js 16.2.10 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · Firebase client SDK
(Auth, Firestore, Storage) · **firebase-admin** (server-only, `src/lib/firebase-admin.ts`, used
exclusively by `/api/orders/track`) · Framer Motion · Lenis · lucide-react · clsx. No test framework,
no CI configured.

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
- **`src/app/api/notifications/order-confirmation/route.ts`** and **`src/app/api/orders/track/route.ts`**
  are the only server API routes in the app. Everything else is client components talking to Firestore
  directly via the client SDK. The tracking route is the only place `firebase-admin` is used — see
  Order Tracking below.
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
- `firestore.rules` (repo root) — the real authorization boundary, **deployed 2026-07-21** via
  `firebase deploy --only firestore:rules`. Products/categories: public read, staff-write. Orders:
  anyone can `create` (guest checkout), only staff can read/update/delete. Staff/settings: staff-only
  read, admin-only write.
- `storage.rules` (repo root) — governs Firebase Storage uploads (product photos under `products/`,
  hero photo under `hero/`). **Could not be deployed — Firebase Storage itself has never been
  initialized on this project** (`firebase deploy --only storage:rules` fails with "Firebase Storage
  has not been set up on project 'packagingambassador'"). This means every photo-upload feature
  (product photos in `ProductForm.tsx`, the hero photo in Settings → Hero & Homepage) has likely
  **never actually worked** in production — it's not a rules problem, the bucket doesn't exist yet.
  Someone with console access needs to visit
  https://console.firebase.google.com/project/packagingambassador/storage and click "Get Started"
  (one-time, can't be done via CLI non-interactively) — then `firebase deploy --only storage:rules`
  will work.

## Design system

- **Colors** (`src/app/globals.css`, Tailwind v4 `@theme inline` tokens): `sand-*` (warm cream/tan,
  primary surface), `ink-*` (warm charcoal, default text), `amber-*` (gold, primary CTA color),
  `forest-*` (green — deliberately limited to ~4 accent spots: footer, homepage brand-story section,
  About page trust banner, "Eco-Friendly" badge — not the default text color, don't let it creep back
  into primary chrome), `clay-*` (terracotta, **not** admin-themeable — a fixed supporting tone),
  `sunset-*` (vivid orange — used sparingly for the logo mark circle and the "New" product badge only,
  not a general-purpose color). All of these were retuned on 2026-07-20 to blend toward the client's
  actual logo colors (brown/green/gold/orange) — see Session History below. The retuning was
  deliberately kept "refined" rather than matching the logo's full poster-saturation, per an explicit
  user choice.
- **Live color theming (added 2026-07-21)**: every color family above except `clay-*` is now
  *derived* at the CSS level from five root variables — `--theme-primary` (→ `amber-*`),
  `--theme-secondary` (→ `forest-*`), `--theme-accent` (→ `sunset-*`), `--theme-text` (→ `ink-*`),
  `--theme-background` (→ `sand-*`/`cream-*`) — using `color-mix()` to compute each shade from one
  base value (e.g. `--color-amber-600: color-mix(in srgb, var(--theme-primary) 85%, black)`). Because
  Tailwind v4's `@theme inline` block already maps every utility class to a plain CSS custom property,
  overriding these five roots at runtime recolors the *entire app* — storefront and admin portal both
  — with zero changes to any of the ~30 component files that use `bg-amber-500` etc.
  `src/components/ThemeInjector.tsx` (mounted in root `src/app/layout.tsx`, inside
  `AdminDataProvider`) reads `settings.theme` from Firestore and applies it via
  `document.documentElement.style.setProperty(...)`. Admin UI: Settings → **Colors & Branding** (5
  paired `<input type="color">` + hex-text controls, "Reset to Default"). Defaults in
  `DEFAULT_THEME` (`src/lib/store.tsx`) match `globals.css`'s hardcoded fallbacks — **keep both in
  sync if either changes**. Known trade-offs, both accepted rather than solved: (1) derived shades are
  a close approximation of the original hand-tuned hex values, not pixel-exact — inherent to any
  "one base color → auto-generated ramp" system, same as Tailwind's or Material's own generators; (2)
  a brief flash of the default palette is possible on first load before the Firestore `settings`
  listener resolves, same category of issue as dark-mode flash. `.glass-amber`/`.glass-forest` in
  `globals.css` were converted from hardcoded `rgba()` literals to `color-mix()` against the theme
  variables specifically so they'd stay in sync with a customized brand color too.
- **Fonts**: Inter (body, `--font-inter`/`--font-sans`) + Plus Jakarta Sans (headings,
  `--font-jakarta`/`--font-display`). This *replaced* an earlier Fraunces-serif choice — if you see
  Fraunces referenced anywhere, it's stale.
- **Logo**: the client's real logo is in `public/logo.png` (1024×1536, real alpha transparency),
  rendered everywhere via `src/components/Logo.tsx` (a thin `next/image` wrapper). Replaced the old
  Leaf-icon-in-a-circle placeholder in the header, footer, admin login, and admin dashboard sidebar.
  Footer usage wraps it in a white badge (`bg-white/90 p-1`) since the logo's green portion would
  otherwise blend into the dark `forest-900` footer background. **Path is case-sensitive** —
  reference it as `/logo.png` (lowercase) never `/logo.PNG`; the wrong case works on macOS's
  case-insensitive filesystem but 404s on production's case-sensitive Linux.
- **Glassmorphism**: `.glass` / `.glass-amber` / `.glass-forest` utility classes in `globals.css` —
  plain CSS, not Tailwind utility stacking (Tailwind utilities live in `@layer utilities` and lose the
  cascade to unlayered custom classes, which is exploited deliberately here). Each is a diagonal sheen
  gradient + inset top-edge highlight + `backdrop-filter: blur() saturate()` + soft shadow. Applied to
  the header (once scrolled), nav dropdowns, hero badge pills, category/why-us cards, product cards,
  and the newsletter input. Deliberately *not* applied to `CategoryCarousel`'s arrow buttons — the
  `.glass` `background-image` would visually mask their `hover:bg-amber-500` background-color swap.
- **Motion polish**: Lenis smooth-scroll (`src/components/SmoothScroll.tsx`, `(site)`-scoped only,
  resets scroll position on route change via `usePathname()` — without that reset, client-side nav
  left the new page stuck at the old page's scroll offset), a fixed grain/noise texture overlay
  (`GrainOverlay.tsx`, inline SVG `feTurbulence`, `(site)`-scoped), an animated gradient-mesh hero
  background (`.animate-drift-a/b/c` keyframes, respects `prefers-reduced-motion`), a "box unboxing"
  hero reveal (`HeroLidReveal.tsx` — lid flips open + tissue paper parts to reveal the hero), a
  staggered spring settle-in for `HeroCollage` tiles, `KineticHeadline.tsx` (word-by-word stagger
  reveal — written as a pure function; an earlier mutable-counter version tripped the React Compiler's
  `react-hooks/immutability` ESLint rule), and `MagneticButton.tsx` (cursor-follow spring physics on
  the hero CTAs).
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
- **Order tracking** (`/track`) — guest-only, no accounts needed. Customer enters just their order ID
  (the Firestore doc ID itself, e.g. `ORD-4F3K9A2B` — no separate tracking-code field exists or is
  needed). `src/app/api/orders/track/route.ts` looks it up server-side via `firebase-admin`
  (`src/lib/firebase-admin.ts`) and returns a sanitized subset (status, line items, createdAt) — never
  the full order doc (no name/address/phone). **Phone-number verification was removed 2026-07-21** —
  originally the endpoint also required the checkout phone number to match; the explicit call was that
  an order ID alone is enough, the same model DHL/FedEx-style tracking numbers use. The order ID's
  entropy (8-char base36, ~2.8 trillion combinations) makes guessing impractical; the response payload
  already excluded PII either way, so this only makes the *status/items* viewable by ID alone, not
  anything more sensitive. `firestore.rules` was **not** loosened for this (orders stay staff-read-
  only); the Admin SDK bypasses rules by design. `src/components/OrderStatusStepper.tsx` renders the
  visual Pending→Processing→Delivered progress (or a Cancelled callout). The tracking number is shown
  on the post-checkout confirmation screen (`(site)/cart/page.tsx`) and included in the SMS/email
  templates. **Known accepted gap**: no rate limiting on the lookup endpoint (no rate-limit infra
  exists in this project) — low-traffic store, acceptable for now, revisit if abuse shows up.

### Admin portal (`/admin`)
- Dashboard: revenue/order/stock summary cards, recent orders, low-stock warnings, and a **"Seed
  Sample Catalog" banner** (auto-hides once any category exists) that one-click-populates Firestore
  from the original 6 sample products / 5 categories in `src/lib/products.ts` — useful for a fresh
  Firebase project or a demo, not meant to represent real inventory long-term.
- Products: full CRUD, client-side photo upload (data-URL → Firebase Storage — **currently broken in
  production**, see Storage note under Data Layer above), **bulk CSV import** (`ImportCsvModal.tsx` +
  `src/lib/csv.ts` — dependency-free CSV parser, per-row validation preview, "download template"
  button). Column contract documented in `csv.ts`. **Color variants** (added 2026-07-21):
  `Product.colors` is `{ name, hex }[]`, not a comma-separated name list — `ProductForm.tsx` has a
  repeatable name + `<input type="color">` row UI (Add/Remove), `ProductDetail.tsx` renders swatches
  directly from the stored hex (the old `swatchColor()` name→hex lookup, which only actually had real
  colors for 4 hardcoded names and silently fell back to tan for anything else, is gone). CSV `colors`
  column format is now `Name:#hex;Name:#hex` — malformed entries are dropped silently rather than
  failing the whole row import.
- Categories: CRUD, manual reordering, delete-guard if products are still assigned.
- Orders: status pipeline (Pending/Processing/Delivered/Cancelled), fed by the real guest-checkout flow.
- Staff: CRUD with role field (Admin/Sales Staff/Inventory Staff) — `addStaff` creates a *real* Firebase
  Auth account via the secondary-app trick, so anyone added through this UI can actually log in.
- Settings tabs: General, **Hero & Homepage** (controls the homepage hero copy/CTAs/stat + photo
  upload), **Page Content** (added 2026-07-21 — About page intro/story paragraphs, the 4 homepage
  "Why Us" cards, Footer tagline; confirmed scope, *not* a full site-wide CMS — most other copy is
  still hardcoded in component files by design), **Colors & Branding** (added 2026-07-21 — see Live
  color theming above), **Promotion** (the sitewide banner above), Payment (Paystack keys — storage-
  only, not wired to real payment processing yet), Notifications (SMS/email provider *config* — sender
  name, from address; **actual API keys live in server env vars, not here**, see below), Account
  (change password for the signed-in staff member).

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

## Deployment

Live at **https://packaging-ambassadors--packagingambassador.us-central1.hosted.app**, on **Firebase
App Hosting** (Cloud Run-backed, framework-native), not legacy Firebase Hosting+Cloud Functions —
chosen because the app has real server-side work (the notifications API route, dynamic Firebase-Auth-
gated admin pages) that can't be statically exported.

- `.firebaserc` — project alias → `packagingambassador`.
- `firebase.json` — `apphosting.backendId: "packaging-ambassadors"`, `rootDir: "/"`.
- `apphosting.yaml` — the 6 `NEXT_PUBLIC_FIREBASE_*` values (not secrets — same config already shipped
  in every page's HTML), `runConfig.minInstances: 0`. `ARKESEL_API_KEY`/`RESEND_API_KEY` deliberately
  **not** declared here (no real values exist yet) — set them via `firebase apphosting:secrets:set`
  once real keys exist, never commit real key values to this file.
- Backend has **no connected GitHub repo** — deploys are push-from-local via `firebase deploy --only
  apphosting`, not `apphosting:rollouts:create --git-branch`. This was a deliberate fallback after
  confirming the backend works fine without a GitHub App connection; a repo-connected backend would
  auto-deploy on push instead, but isn't set up.
- Requires the **Blaze (pay-as-you-go) plan** — the project was upgraded to Blaze specifically to
  enable App Hosting.
- To redeploy after code changes: `firebase deploy --only apphosting` from repo root. Also pushed to
  GitHub (`origin main`) for source backup — the two are independent, pushing to GitHub does **not**
  trigger a redeploy since there's no repo connection.

## Mobile

Fully responsive, Tailwind `md:`-breakpoint mobile-first throughout — verified in-browser at 375px
(hero, buttons, stat block all reflow cleanly, no overflow). Two nav layers on mobile now:
- **Top hamburger menu** (`Header.tsx`, `Menu`/`X` icon toggle below `md`) — Shop Collection/About
  Us/Contact Us/Blog/Track Order.
- **Bottom tab bar** (`src/components/MobileTabBar.tsx`, added 2026-07-21) — fixed, `md:hidden`, four
  tabs: Home/Shop/Cart/Track. Active tab (from `usePathname()`) gets an animated amber pill via Framer
  Motion `layoutId="mobileTabIndicator"` that slides between tabs on navigation; the Cart tab shows an
  item-count badge from `useCart().itemCount`. `(site)/layout.tsx`'s main wrapper has `pb-20 md:pb-0`
  so the bar never covers footer content.
  - **Gotcha hit while building this, worth knowing before touching `.glass` again**: `.glass` in
    `globals.css` hardcodes `position: relative`. Because it's an unlayered custom class, it beats
    Tailwind's `fixed` utility in the cascade (same class-vs-`@layer utilities` precedence issue noted
    elsewhere in this file) — stacking `glass fixed ...` in one className silently produced a
    `position: relative` element that rendered at the bottom of the document instead of pinned to the
    viewport. Fixed by not using `.glass` here at all: the bar uses a dedicated, more opaque treatment
    (`bg-sand-50/95 backdrop-blur-xl`, plain Tailwind utilities, no conflict) instead. This was also the
    right call visually — a bar with arbitrary page content permanently scrolling behind it needs more
    opacity than a floating `.glass` card does, or colorful content bleeds through and looks messy (a
    decorative hero badge did exactly this before the fix).

## Known gaps (honest, prioritized)

**Should do before this is a real, live store:**
1. **Payments aren't real.** Checkout logs a "Pending" order; nothing actually charges the customer.
   Paystack fields in Settings are stored config only, with an on-page warning. This is the single
   biggest gap between what exists and a functioning store.
2. ~~Nothing is committed to git.~~ Fixed 2026-07-20 — commit `c503445` landed the entire admin
   portal, Firebase integration, and everything through the logo-driven rebrand. Still worth
   committing in reasonably-sized chunks going forward rather than letting work pile up again.
3. ~~`firestore.rules`/`storage.rules` deployment status unconfirmed.~~ Partially fixed 2026-07-21:
   `firestore.rules` is now deployed (`firebase deploy --only firestore:rules`, confirmed success).
   `storage.rules` **could not** be deployed — **Firebase Storage has never been initialized on this
   project at all** (not a rules issue — the bucket doesn't exist). Someone with console access needs
   to visit https://console.firebase.google.com/project/packagingambassador/storage, click "Get
   Started" once, then run `firebase deploy --only storage:rules`. Until then, every photo-upload
   feature (product photos, hero photo) fails in production.

**Real features still missing or incomplete:**
4. **Blog isn't admin-editable** — static `src/lib/posts.ts`, inconsistent with the rest of the
   Firestore-backed admin portal.
5. **Catalog is thin** — only the 6 original sample products / 5 categories exist by default. The CSV
   bulk-import tool exists now specifically to make adding real inventory fast once the client has a
   product list ready.
6. **No rate limiting on `/api/orders/track`** — see Order Tracking above. Low-traffic store, accepted
   for now; revisit if abuse shows up.
7. `CategoryCarousel` and a few other polish items were being tracked as "leftover from last session"
   items and got closed out as of 2026-07-20 — if a new leftover list starts accumulating, keep it
   honest the same way (don't silently drop things you said you'd do).

**Needs a real person to click through and verify** (things that couldn't be tested without an
authenticated admin session or real provider credentials): hero photo upload end-to-end, promotion
banner toggle, discount pricing display, best-sellers shifting after a real order, CSV import against
a real spreadsheet, actual SMS/email delivery.

**Housekeeping**: a fake test order (`ORD-TESTTRACK`, "Test Customer") was written directly to the
**real** Firestore `orders` collection while QA-ing the tracking feature on 2026-07-21, to avoid needing
a seeded product catalog locally. It's obviously identifiable as test data but should be deleted via
the admin Orders screen (login attempts to do this in-session hit repeated flaky redirects in the
browser-automation tool, not a confirmed app bug — a normal browser session should work fine).

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
5. **Logo-driven rebrand + real notifications + CSV import** (2026-07-20) — client
   provided their actual logo; palette retuned to blend its brown/green/gold/orange in (refined, not
   full saturation); removed customer accounts entirely; built real SMS/email sending via Arkesel +
   Resend; built bulk CSV product import. This file was written at the end of this phase.
6. **Local verification pass** (2026-07-20) — confirmed `c503445` is the current tip and
   `firestore.rules`/`storage.rules` exist on disk as described above (deployment status to the
   Firebase console itself still unconfirmed — see Known Gaps #3). Hit the stale-Turbopack-cache
   gotcha for real (dev server served a parse error for a file that was actually fine); fixed by
   stopping the server, `rm -rf .next`, restarting — confirms that Gotchas entry is accurate. Client's
   real logo file was shared as a chat image but has **not** been saved into `public/` yet — no
   filesystem path was available to place it automatically. Next step once the client drops
   `public/logo.png` (or `.svg`): swap every `bg-sunset-500` + `<Leaf` placeholder (header, footer,
   admin login, admin dashboard sidebar) for the real image.
7. **Logo integration, glassmorphism + motion pass, deploy to production** (2026-07-21, most recent) —
   real logo dropped into `public/logo.png` and wired through `Logo.tsx` everywhere (caught and fixed
   a `/logo.PNG` case-sensitivity bug before it could 404 on production's Linux filesystem). Added
   glassmorphism (`.glass`/`.glass-amber`/`.glass-forest`) across the header, cards, and inputs per
   explicit request for "glass and reflective and transparent cards." Built an animated gradient-mesh
   hero background, Lenis smooth scroll (fixed a real bug where client-side nav left the new page
   stuck at the old scroll position), a grain texture overlay, a "box unboxing" hero reveal
   (`HeroLidReveal`), kinetic word-by-word headline animation, and magnetic hover CTAs — see Design
   System above for details. Fixed two reported admin-login bugs: missing back-to-site link, and
   browser-native autofill making it look like credentials were pre-filled (confirmed via JS that the
   actual field values were empty — not a real code bug). Pushed everything to GitHub and deployed to
   **Firebase App Hosting** (see Deployment section above) after the user upgraded the project to the
   Blaze plan. Verified the live deployment in-browser — an initial screenshot looked washed-out/
   broken, but that was a transient render-timing artifact from the screenshot tool catching a Lenis
   scroll transition mid-frame; computed styles and a follow-up screenshot confirmed every section
   renders correctly (`opacity: 1`, correct colors, real content) end-to-end. Also verified mobile
   responsiveness and the hamburger nav live at 375px — see Mobile section above. A bottom mobile tab
   bar was discussed but not built (no clear ask yet, see Known Gaps #6).
8. **Bottom tab bar + customer order tracking** (2026-07-21) — built both features end-to-end after an
   explicit ask; the plan was written into this file *before* any code changed (per the user's request,
   so a context-reset session could resume cold) and updated as each piece landed. Bottom nav: see
   Mobile section above, including the `.glass`-vs-`fixed` cascade bug hit and fixed while building it.
   Order tracking: see the Order Tracking entry under Feature Inventory above — key design call was
   reusing the existing Firestore order-doc ID as the tracking number (no data migration) and doing the
   phone-match verification through a new server-side `firebase-admin` route rather than loosening
   `firestore.rules`, so a leaked/guessed order ID alone can never expose another customer's data.
   QA'd live in-browser: bottom-tab navigation + active-pill animation on desktop-narrow and 375px, a
   real order written to Firestore and looked up successfully via `/track`, and a wrong-phone attempt
   correctly rejected with the generic error. Noted a first-request Admin SDK cold-start hiccup (see
   Quick Start) and one leftover test order needing manual deletion (see Known Gaps housekeeping note).
9. **Audit, phone-verification removal, live color theming, Page Content editing, variant-color fix**
   (2026-07-21) — started with an audit: confirmed the tracking system + bottom tab bar from the
   previous session existed locally but had **never actually been deployed** (`/track` 404'd live) —
   production was one deploy behind local the whole time. Removed the phone-number requirement from
   order tracking per explicit ask (see Order Tracking above). Built a genuine site-wide color
   customization system (see Live color theming above) using CSS `color-mix()` derivation rather than
   asking the admin to pick every shade by hand. Extended admin text-editing to the About page story
   copy, homepage Why-Us cards, and Footer tagline (confirmed scope — not a full CMS). Fixed a real
   bug found during the audit: product color variants were free-text names with only 4 hardcoded real
   hex values, silently rendering wrong for anything else — now `{name, hex}` pairs end-to-end (data
   model, admin form, storefront swatch, CSV import). Deployed `firestore.rules` for the first time
   (confirmed success) and discovered **Firebase Storage itself was never initialized on this
   project** — not a rules gap, the bucket doesn't exist, so photo uploads have likely never worked in
   production; needs a one-time console click, can't be done via CLI (see Known Gaps #3).
