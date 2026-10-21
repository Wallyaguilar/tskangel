# Leadership dashboard

Open `/admin` and sign in with an existing authorized administrator account. This update does not grant new administrators access or change existing passwords.

## One-time database setup

Apply **003_leadership_dashboard.sql** in the Supabase SQL Editor after migrations 001 and 002 have succeeded. Use a new query; paste the complete file, and Run. The current 003 file checks prerequisites before changing anything, runs in one transaction, and may be retried after prerequisites exist. Do not re-run the original migrations. Migration 003 adds the private testimonial table, a server-only metrics function, and indexes. It does not delete, archive, move, or publish existing records.

Until migration 003 is installed, the overview explains that totals are unavailable and testimonial editing is disabled. Existing event, application, donation and email controls remain available under their tabs.

## Sections

- **Overview:** exact application and confirmed subscriber counts; six UTC months of completed sandbox donation totals; next six active outreach dates and their registration deadlines; latest ten applications. No invented statistics or events. Aggregate donation totals do not have the transaction list's 50-record limit. Currencies remain separate. Refunded/partially refunded transactions are excluded entirely; this is not a net revenue or payout statement. No active recurring donor count is inferred from donation rows.
- **Events & dates:** existing create/edit/status/publication tools and latest 100 registration review records. Draft events appear only in leadership views. Sensitive meeting instructions remain private.
- **Volunteers:** newest ten applications, name/email search, and ten-record pages through earlier applications. Review, notes, and authorized CSV export remain available. Earlier people already live in private Supabase cloud storage; no second storage service is needed. This is a paginated records view, not automatic deletion or a changed retention policy. Name/email search supports common name and email punctuation and rejects query-filter syntax; other characters produce a visible explanation.
- **Donations:** latest 50 webhook-recorded test transactions. Summary charts are on Overview. Stripe remains the source for subscriptions, payments, refunds and payouts. Live payments remain disabled.
- **Newsletters:** existing separate opt-in campaign workspace, counts, and audience pages of ten records. Pending addresses are never treated as confirmed subscribers. Campaign queuing/sending remains explicit.
- **Testimonials:** enter an authentic quote, approved public name or alias, perspective and private consent record. Save as private by leaving publication unchecked. Publishing requires both the consent acknowledgment and a meaningful consent record; the database enforces this as well as the server. Private notes and consent evidence never go to the public site. Approved public testimonials appear on the homepage (latest six); the entire section is hidden if none are approved or storage is unavailable. To withdraw, uncheck publication and consent and save. The record stays private. This phase supports leadership-entered statements; there is no public testimonial submission form or consent attachment upload. Do not publish minors' statements through this workflow. Assistance must never depend on giving a testimonial.
- **Website content:** existing mission and vision editing.
- **Email delivery:** existing retry tools and branded design preview.

## Performance and privacy

Each dashboard section fetches only its relevant records. Overview aggregates use a server-only database function instead of downloading every application, subscriber and donation. Recent lists and key status/date queries have indexes. No private dashboard data is publicly cached. Counts require database work as records grow; measure actual query times and Supabase/Vercel limits before deciding on scaling. Name/email substring search may need a dedicated search index at larger volumes. Generic outreach images still need a separate production image optimization/performance review.

## Verification for this change

Production build passed; all 59 automated tests passed against an isolated local Postgres 17 database with migrations 001–003. Tests cover permission restrictions, full-history counts, donation totals beyond 50 rows, currency separation, consent enforcement and withdrawal. Desktop (1360px) and mobile (390px) overview fixtures passed automated WCAG checks and overflow checks. The fixture statistics and people exist only in local review artifacts, never in the real database. Hosted data, authenticated UI flows, actual service-plan performance and real testimonial consent must still be reviewed in the configured preview project.

## Recovering from a missing newsletter table

An error saying `relation "newsletter_subscribers" does not exist` means update 002 has not successfully created the newsletter tables. In a **new** Supabase SQL query, paste the complete `002_newsletters.sql` file and run it. After it succeeds, use another new query to run the complete current `003_leadership_dashboard.sql` file. Do not delete any tables, records or existing queries. The current 003 also tolerates its own already-created table/indexes, so a partial earlier 003 attempt does not require deleting anything. If 002 instead reports an existing relation, stop and inspect that partial newsletter setup rather than deleting records or repeatedly running individual statements. Success of these local recovery tests does not confirm changes in the user's hosted database.
