# Connect the TskAngel preview

The GitHub/Vercel preview can display the calendar, signup questionnaire, giving options, and vision board immediately. Personal records and actual test checkout require the connections below. Nothing changes GoDaddy DNS, the existing tskangel.com site, existing email, or live payments.

## 1. Supabase database

Use project `eyggbqpsowkklqmxsrwp`. Open **SQL Editor → New query**. Copy the complete contents of `supabase/migrations/001_outreach_platform.sql`, then run it **once**. This creates new application tables, grants, RLS protections, and database functions. It does not seed any public events or impact claims. If tables already exist, stop and inspect the error instead of dropping them or repeatedly running the migration.

In **Vercel → tskangel → Settings → Environment Variables**, add:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | `https://eyggbqpsowkklqmxsrwp.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your private Supabase server key (legacy service_role, or the supported server secret key), copied directly from Supabase project settings |
| `SITE_URL` | `https://tskangel.vercel.app` |

Do not put the private key in a `NEXT_PUBLIC_` variable, GitHub files, screenshots, or chat. Mark it sensitive where Vercel offers that option. Configure the Vercel Production environment for the standalone `.vercel.app` site, and Preview if desired. Redeploy after saving environment variables; saving values alone does not change an existing deployment.

To run authenticated integration tests in this Codex cloud environment too, provide the matching secure key through **cloud environment settings**, not chat. The setup draft declares a secure key requirement for this exact Supabase hostname. A Vercel variable does not automatically propagate to the cloud machine.

## 2. Leadership sign-in

In Supabase **Authentication → Users**, create your approved administrator user with an email and strong password. Use an email you control. Then run a new SQL query (replace the email first):

```sql
insert into public.administrators(user_id)
select id from auth.users where lower(email) = lower('YOUR_APPROVED_ADMIN_EMAIL')
on conflict do nothing;
```

Verify that one row appears in `public.administrators`. Do not assign this role to public applicants. Visit `/admin/login` on the preview and sign in. No public administrator signup is provided. Session cookies are HttpOnly, Secure on HTTPS, SameSite=Lax, and expire within one hour. Server-side role checks protect every admin operation and export. Supabase MFA enrollment/enforcement and password-recovery UI remain follow-up work; password recovery can be administered in Supabase meanwhile.

In the dashboard you can create draft or published events, review volunteer applications, approve/decline pending event registrations, edit mission and vision, and retry queued emails. Enter only real, confirmed events. Keep precise meeting directions in the private instructions field. General public locations and organizer contact fields are public when an event is published.

## 3. Volunteer application and calendar checks

Use **synthetic data** until privacy policies, contact details, and retention arrangements have been reviewed and applications are approved for real intake.

1. Submit a volunteer application. Verify a new pending row in the private dashboard, separate acknowledgment/privacy consent, and the durable confirmation/admin email queue entries.
2. Create a draft event, verify it is absent from public views, and then publish it. Verify the public calendar and details show only safe fields.
3. Register for an event. It should remain pending until approved. Pending and approved requests reserve capacity. Duplicate active registrations do not reserve another place or disclose existing details. Full events reject new places transactionally.
4. Approve the event request in the dashboard. Private meeting instructions are included only in the approved registration email, not the public event API or calendar exports.
5. Change event date/time/location or cancel it. Check the public status, revision, audit record, and queued notification with previous/current details. Keep canceled events published so they remain visible.
6. Download ICS and inspect it in Apple/Outlook; test the Google/Outlook links. Exports use UTC instants and a valid named time zone for display. Stable UID, revision, last-modified time, and canceled status are included. A downloaded file does **not** automatically synchronize later edits.
7. Use the private cancellation link in the email to release the registration. Opening the link does not mutate data; confirmation requires a POST.
8. An unauthenticated visitor must be redirected from `/admin` and receive 401 from admin mutation/export endpoints. A signed-in Supabase user without an explicit administrator role must also be denied.

A full authenticated volunteer portal, profile editing, attendance tracking, reminder scheduler, and newsletter system are not implemented in this increment. Public event requests are accepted for review; there is no claim that a request is an approved volunteer account.

## 4. Operational email (optional connection, required for actual delivery)

Create a Resend account. Add private `RESEND_API_KEY`, approved `EMAIL_FROM`, and `ADMIN_NOTIFICATION_EMAIL` in Vercel. Do not change email DNS during development. Use the provider's permitted test sender and verified recipient for initial tests, subject to its current account restrictions. A production sender requires a later approved domain-authentication step that preserves existing email records.

Application confirmations, application-review updates, event registrations, event changes, approvals, and cancellations are queued durably. Actions attempt delivery after saving. Retry pending messages from `/admin`; this increment has no scheduled background worker. The provider receives an idempotency key for each outbox message. Verify inbox delivery separately: a queued record or provider acceptance alone does not prove delivery. No marketing list is created.

## 5. Stripe (test mode only)

Create a Stripe account and use its **sandbox/test mode**. Add `STRIPE_SECRET_KEY` with a `sk_test_` (or appropriately scoped `rk_test_`) key. Configure a **test** webhook destination:

`https://tskangel.vercel.app/api/stripe/webhook`

Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, and `customer.subscription.deleted`. Add its signing secret as `STRIPE_WEBHOOK_SECRET`, then redeploy. Do not send either key in chat.

The giving form creates hosted test Checkout sessions for USD card payments. Monthly contributions start at $10; one-time gifts have no $10 minimum (Stripe's USD minimum applies). Non-test secret keys are refused, and live webhook events are rejected. Completion is recorded only after a verified webhook; a browser return is never treated as payment proof. Completed-payment records resist duplicate events and later failed-payment messages. Subscription checkout metadata links invoice events to TskAngel. The dashboard shows test records, not actual income.

For test donor self-service, enable Stripe Customer Portal and add its **test** customer-login link in `STRIPE_CUSTOMER_PORTAL_URL` (a `https://billing.stripe.com/p/login/test_...` URL). Stripe handles donor authentication and payment details. Never create a donor portal session based solely on an unauthenticated email form.

Test one-time payment, recurring initial invoice/renewal, failure, duplicate webhook, and subscription cancellation in Stripe. Do not assume test-mode transaction emails are delivered automatically; check current Stripe receipt settings and test behavior. Refunds for one-time payments are recorded when their signed charge webhook carries TskAngel metadata. Full recurring-refund reconciliation, financial reports, payout reconciliation, changing recurring amounts in-app, and live bank onboarding remain processor-side or follow-up work. No bank login data is collected. No tax-deductibility claim or tax receipt is generated.

**Do not enable real payments or bank payouts until eligibility, legal status, disclosures, processor settings, and explicit launch approval are in place.**

## Data handling and limits

Application tables have RLS with no anonymous/authenticated read policies and explicit revoked access. Only server-side service credentials reach them. Access is reauthorized per admin request. Form bodies and narrative lengths are bounded, cross-origin browser submissions are rejected, honeypots are checked, and shared database rate limits cover public intake/login.

The dashboard shows the latest 100 applications/registrations and 50 donation records. The application JSON export is administrator-only; avoid storing exports in public locations. Individual application deletion is supported, but related registrations, provider email records, backups, and outbox retention require a coordinated retention/deletion process. Review retention monthly before real intake and document the approved schedule. Bulk retention automation, consent-managed photography, and complete legal policy pages remain follow-up work.

Core values currently come from `lib/data.ts`; mission/vision are editable in the dashboard. No authentic logo file is available in the workspace yet. Generic imagery remains visibly labeled.

## Clear checkout results

New Checkout sessions return to `/give?checkout=returned&session_id={CHECKOUT_SESSION_ID}`. A prominent, accessible result banner polls a server-side status endpoint for roughly 35 seconds, then offers manual rechecking. Green means Stripe reports paid **and** the matching webhook-written donation record is completed, with the same amount/currency. Yellow covers pending, unavailable, canceled/expired, or refunded/adjusted results. Red is reserved for confirmed unsuccessful payment information. Test mode remains explicit throughout.

The status response exposes only the result and, when confirmed, the amount/currency—never donor names, email addresses, customer/subscription IDs, or messages. Responses are rate-limited and not cached. The giving page suppresses referrers and hides the new-gift form on checkout return so an uncertain result does not encourage immediate duplicate giving.

Older return URLs without a session reference cannot be matched safely. Check the existing donation in the leadership dashboard instead. No schema migration, new secret, or additional Stripe event selection is required for this change; only new checkouts receive the reference automatically. A redirect alone still cannot create a successful donation record.
