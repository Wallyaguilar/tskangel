# TskAngel — homepage review prototype

Isolated development only. No production website, DNS, email service, or payment account is connected.

## Run

Node.js 24 and npm 11 were used during onboarding.

```sh
cd /workspace/tskangel
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run dev
```

Validation: `npm run build` and `npm run typecheck`. Production smoke test: `npm run start`, then request the root page and confirm the ministry headline and development notice. Do not publish this prototype. Search indexing is disabled.

## First review

This stage contains one responsive homepage with section navigation. Calendar, applications, payments, private portals, and administrative controls are not implemented. No personal information is collected. Generic AI-generated illustrative photographs are visibly labeled, and the original-logo placeholder is explicitly labeled; no illustrative images, impact statistics, events, or testimonials are presented as genuine TskAngel records.

Brand tokens in `app/globals.css` use the exact approved five colors. The current system font avoids external font requests; approved font files can be added later. Scripture uses the public-domain World English Bible. Mission copy remains proposed and will become editable with the CMS.

## Proposed architecture and subsequent phases

- Next.js App Router, React, TypeScript, Tailwind CSS: public pages and server-side operations.
- Supabase: PostgreSQL migrations, row-level security, role-based authentication, volunteer ownership restrictions, private photo storage, and audit records.
- Events: public-safe and private location fields; capacity-controlled transactional registration; time-zone-aware ICS exports; change history and notification outbox.
- Transactional email provider: verified sender, operational templates, retryable delivery, and separate marketing preferences. Sender authentication requires a later approved DNS change.
- Stripe test mode: hosted Checkout, signed webhooks, recurring giving, and customer portal. No successful payment state inferred from redirects. Live mode requires explicit approval, verified legal disclosures, and processor bank onboarding.

Before dependent features: obtain Supabase project configuration, selected email provider and approved sender/contact details, Stripe test configuration, retention decisions, and administrator roles. Enter credentials securely in environment settings, never source code or chat. These integrations are not required to run this homepage.

## Content still required

Original unmodified logo artwork; authentic photographs with permission; founder message; approved contact information; reviewed mission and vision; verified legal status; legal policies; confirmed events and impact records. No tax-deductibility or 501(c)(3) claim is made.

Homepage review and approval precede the remaining pages. Deployment, domain connection, purchases, and live payments require separate explicit approval.

## Current-instance validation

- Frozen-lockfile `npm ci`: passed using the workspace cache.
- Production build and TypeScript checking: passed.
- Production HTTP root request: passed; correct ministry copy, development notice, empty event state, and noindex directive confirmed.
- Chromium rendering at 1440px desktop and 390px mobile: no horizontal overflow; mobile navigation opens and closes.
- Keyboard: first Tab reaches the visible skip link.
- axe-core 4.10.3 WCAG A/AA automated check at mobile size: zero violations, 23 checks passed, one incomplete check requiring human review. This is not full accessibility certification; broader keyboard, screen-reader, and device testing remain.
- Review screenshots and browser-check script are available outside the checkout at `/workspace/tskangel-review`.

Operational workflow tests are not run because calendar registration, authentication, email, and donations belong to later phases and are not implemented in this prototype.

## Homepage imagery and navigation update

Generic illustrative images are now bundled locally under `public/images`; they need no external image account or runtime network access. Next.js optimizes them. They are explicitly labeled as AI-generated, not actual TskAngel outreach. The original logo shown in chat still needs its source file for exact integration.

The homepage uses section navigation rather than separate unfinished pages. Every section link has a matching target. Mobile navigation closes after selecting a link. Home and back-to-top links target the page top. Screenshot previews should be displayed directly in chat; internal workspace paths are not public website URLs.

Update validation: all four bundled image elements decoded successfully; all 21 internal links resolve to existing targets. Browser clicks confirmed each desktop navigation link changes the hash and scrolls to its section. The mobile Volunteer link changes the hash to `#volunteer` and closes the menu. Updated desktop/mobile overflow and accessibility checks passed (zero automated violations, one incomplete check still needing manual review). The build and TypeScript check passed after these changes.

## Calendar, volunteer, giving, and vision increment

Public routes: `/calendar`, `/calendar/[id]`, `/volunteer`, `/give`. Private leadership routes: `/admin` and `/admin/login`. The homepage now includes the vision board and all six approved values. Mission and vision use administrator-editable database content with supplied copy as the initial fallback.

See [Connect services](docs/CONNECT-SERVICES.md) for the Supabase migration, Vercel variables, administrator creation, email queue, and Stripe test configuration. Credentials have not been supplied; actual Supabase authentication/storage, inbox delivery, and Stripe test checkout must still be exercised after connection. Forms show an explicit setup state instead of pretending to save or charge when integrations are missing.

`npm test` runs core tests and skips database tests unless a dedicated test container is provided. Database tests were run against isolated PostgreSQL using the actual application migration, with a minimal test-only `auth.users` table and Supabase role names. This verifies SQL behavior, not hosted Supabase Auth or PostgREST. Do not run fixture tests against the real project.

### Validation for this increment

- Frozen-lockfile installation, production build, and TypeScript check passed.
- 20 tests passed with the isolated PostgreSQL test container (0 failed, 0 skipped): validation, ICS formatting/time-zone instants, cancellation semantics, role restrictions, transactional email queue, webhook idempotency, rate limiting, capacity/concurrency, and proxy-aware origin checks.
- Production HTTP checks passed for the five public/sign-in pages; `/admin` redirected unauthenticated visitors; admin API/export returned 401; cross-origin submission returned 403; unconfigured signup/checkout returned explicit 503; nonexistent event export returned 404.
- Chromium desktop (1440px) and mobile (390px) checks passed for homepage, calendar, volunteer, give, and administrator sign-in: no horizontal overflow, working month/list controls and giving-frequency minimums, zero automated WCAG-tagged axe violations. Some scans retain incomplete items requiring manual review; this is not full accessibility certification.
- Actual hosted Supabase/Auth application submission and admin review, email inbox delivery, and Stripe sandbox checkout/recurring/webhook workflows are **not yet verified** because the services are not connected to this running instance.

### Payment feedback update

Checkout returns now show labeled green/yellow/red status banners above the page content. The server verifies the Stripe session and matches its payment/invoice against webhook-written records before showing success. Pending results poll briefly, allow manual retry, and never imply failure just because confirmation is delayed. Legacy return links cannot confirm a payment without a session reference. No database migration is needed.

Validation: production build and TypeScript passed; 21 unit/validation tests passed with 8 unrelated database tests skipped (database logic unchanged). Desktop/mobile browser tests used intercepted status fixtures for confirmed, pending, failed, refunded, and unavailable results; they passed layout and automated accessibility checks, plus canceled/legacy-link safety checks. Those simulated UI checks are not evidence of an actual Stripe transaction; the new hosted return flow still needs a fresh sandbox checkout after deployment. Actual private Stripe credentials are held in Vercel, not this cloud instance.
