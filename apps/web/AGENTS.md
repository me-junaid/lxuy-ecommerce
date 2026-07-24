# AGENTS.md — Next.js Frontend Engineering Rules
### (apps/web — inherits root `/AGENTS.md`; never overrides it)

## ROLE

Senior Frontend Engineer for the ecommerce web app. Own: Next.js
architecture, component design, UX, performance, accessibility, SEO,
frontend security, state management, and API integration.

---

## FRONTEND MISSION

A premium ecommerce frontend: fast, SEO-optimized, accessible, mobile-first,
conversion-focused, and maintainable. Priority order when tradeoffs arise:

**1. User experience → 2. Performance → 3. Accessibility → 4. Maintainability**

---

## FIXED STACK

Next.js (App Router, React Server Components) · TypeScript (strict) ·
Tailwind CSS. Any change needs a `DECISIONS.md` entry first.

Shared types, UI components, validation logic, and utilities come from
`packages/*` — never redefined locally. Check `packages/ui` before building
a new Button/Input/Modal/Card/Dropdown.

---

## RENDERING STRATEGY (Server vs. Client Components)

**Default to Server Components.** Use them for product/category/SEO pages,
static content, and any data fetching — they ship less JS and hydrate
cheaper.

**Use `"use client"` only when a component genuinely needs:** user
interaction, browser APIs (localStorage, animations), local state, or event
listeners. Push the client boundary as low in the tree as possible — a
`ProductPage` should stay a Server Component even if one button inside it
(`AddToCartButton`) is a Client Component.

```
Good: ProductPage (server) → AddToCartButton (client)
Bad:  ProductPage itself marked "use client"
```

---

## PROJECT STRUCTURE

```
app/
components/      → generic, reusable UI (not feature-specific)
features/        → feature-based vertical slices
hooks/
lib/
providers/
services/         → all API calls live here
store/            → global client state only
types/
```

Each non-trivial feature is self-contained:

```
features/products/
  components/   (ProductCard.tsx, ProductGallery.tsx)
  services/     (product.service.ts)
  hooks/        (useProducts.ts)
  types/        (product.types.ts)
  utils/
```

---

## COMPONENT DESIGN

Small, single-responsibility, composable. A component either fetches data,
holds state, or renders UI — not all three.

```
Good: ProductCard → ProductImage, ProductPrice, AddToCartButton
Bad:  one HugeProductComponent.tsx doing everything
```

---

## STYLING

Tailwind utility classes by default (`flex items-center gap-4`). Avoid
custom CSS files unless a pattern is genuinely reused across many
components — in that case, extract it once, not per-file.

Never hardcode pixel widths for layout (`width:500px`); use responsive
utilities (`max-w-xl`, `w-full`). Design mobile → tablet → desktop, in that
order — there are no desktop-only layouts.

---

## DATA & API LAYER

- **Server-render** product data, categories, and any public/SEO content.
- **Client-fetch** only for user-driven interaction: filters, live search,
  real-time updates.
- All calls go through `services/*.service.ts` — never `fetch()` inside a
  component. `Component → Service → API`, always.
- Never fetch or expose sensitive data directly in browser-executed code.

---

## STATE MANAGEMENT

Don't reach for global state by default — keep state as local as the
component that needs it.

- **Server state** (products, orders, user data): server fetching/caching,
  not client stores.
- **Client state** (cart UI, filters, modals, transient UI): local
  component state or a scoped store — never dumped into one global store.

---

## FORMS

Every form needs: client-side validation for UX, loading state, error
handling, and success feedback. **Server-side validation is mandatory
regardless of client validation** — never trust the client alone.

---

## AUTHENTICATION (frontend responsibility only)

Never store access or refresh tokens in `localStorage`. Frontend handles:
route protection, session display, and permission-based UI. Actual
authorization is enforced server-side (see root `AGENTS.md` /
`SECURITY.md`) — the frontend never becomes the source of truth for access
control.

---

## ROUTES

```
/
/products
/products/[slug]
/category/[slug]
/cart
/checkout
/account/orders
/admin
```

---

## SEO

Every public page: metadata, title, description, Open Graph, canonical URL.
Product pages additionally need structured data (Product schema): price,
availability, reviews.

---

## IMAGES

Always `next/image` — never a raw `<img>` for application images. Set
loading priority for above-the-fold images; let everything else lazy-load.

---

## PERFORMANCE

- **Bundle:** avoid heavy dependencies and unnecessary Client Components.
- **Rendering:** pick Server/Static/Dynamic deliberately per page — don't
  default to dynamic rendering out of convenience.
- **Every async operation** (data fetch, mutation) needs a loading, error,
  *and* empty state — not just a happy path.

---

## ACCESSIBILITY (WCAG baseline)

Keyboard navigation, screen-reader labels, visible focus states, sufficient
color contrast. Never use a `<div>` as a button or a `<button>` as a link —
use the semantically correct element so assistive tech and keyboard nav
work for free.

---

## ERROR / LOADING / EMPTY STATES

Every route segment implements `loading.tsx`, `error.tsx`, and handles the
empty-result case explicitly (e.g. "no products match your filters," not a
blank grid).

---

## SECURITY

Never expose API secrets, private keys, or admin credentials in
client-side code (check anything passed to a Client Component or embedded
in `NEXT_PUBLIC_*` env vars). Sanitize all user-generated content before
rendering; never use `dangerouslySetInnerHTML` on unsanitized input.

---

## TESTING

- **Component tests** — rendering + interaction.
- **Integration tests** — service-layer API interaction.
- **E2E** — login, search, add-to-cart, checkout, payment at minimum.

---

## ECOMMERCE-SPECIFIC RULES

- **Product pages:** images, variants, pricing, stock status, reviews,
  related products.
- **Cart:** guest cart, authenticated cart, quantity updates, price
  recalculation, stock validation on every change.
- **Checkout:** accurate totals, graceful error handling, and submission
  guarding to prevent duplicate orders on double-click/refresh.
- **Orders:** never infer payment success from client-side UI state alone
  — always confirm against the backend.

---

## DEFINITION OF DONE (frontend)

- [ ] Server/Client Component boundary is correct and minimal
- [ ] Responsive across mobile/tablet/desktop
- [ ] SEO metadata present (and structured data, if a product/category page)
- [ ] Loading, error, and empty states all handled
- [ ] Accessibility checked (keyboard + screen reader + contrast)
- [ ] API calls go through `services/`, not inline in components
- [ ] Shared components/types reused from `packages/*`, not duplicated
- [ ] TypeScript strict, no unjustified `any`
- [ ] Tests added for the critical path

---

## FINAL RULE

Beautiful for users. Simple for developers. Fast for browsers. Easy to
maintain for years.