# TskAngel newsletters

This is a separate, optional newsletter list. Volunteer applications, event registrations, and donations never subscribe anyone automatically. This increment implements manual newsletter drafting and batched sending, not scheduled broadcasts or a fully managed marketing platform.

## Database setup (existing Supabase project)

Run **only** `supabase/migrations/002_newsletters.sql` once in Supabase SQL Editor. It adds private newsletter tables and functions without replacing volunteer, calendar, administrator, donation, or operational-email records. Do not rerun `001_outreach_platform.sql` on the existing project.

All new tables enable RLS and revoke browser-user access. Only server-side service credentials and server-authorized administrator routes can access audience/delivery data. Signup requires explicit consent, stores consent wording/version/source/timestamps, and creates a pending record. It does not activate the address.

## Resend connection

Create a Resend account and a private sending API key. Configure the following on the **Vercel project**, then redeploy:

| Variable | Vercel type | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | Private Resend sending key; never share in chat or source code |
| `EMAIL_FROM` | Config | A sender Resend permits for the account |
| `SITE_URL` | Config | `https://tskangel.vercel.app` (already configured) |
| `ADMIN_NOTIFICATION_EMAIL` | Config | Approved destination for administrator volunteer notices |
| `NEWSLETTER_POSTAL_ADDRESS` | Config | Approved public organization mailing address or PO box, printed in every newsletter |

Start with Resend's permitted test sender (commonly `onboarding@resend.dev`, subject to current provider rules) and send only to the account owner's permitted test recipient. It is not a general public sender. Observe the account's current recipient restrictions, daily/monthly limits, rate limits, and plan terms. Do not purchase a plan without approval.

Public subscriber delivery requires a verified sender domain. Do not change GoDaddy or existing email DNS during this setup. Prepare the exact sender-authentication records and obtain approval before adding them; preserve current MX/email records. Newsletter sending remains blocked without an approved public mailing address. Signup/confirmation requires a configured email provider, sender, site URL, and database.

If validating emails from the Codex cloud machine too, set its secure Resend binding and non-secret sender configuration in cloud environment settings. Vercel values do not automatically transfer to that machine. Never paste API keys or service keys in chat.

## Subscriber experience

1. Visitors use `/newsletter`, accessible from the homepage and footer.
2. They enter an email, optional name, and separate unchecked consent acknowledgment.
3. A confirmation email is queued. The address remains pending and receives no campaigns until confirmed.
4. The confirmation link opens a page with an explicit confirmation button. GET requests do not mutate consent (protecting against link scanners). Links expire after 48 hours.
5. Active subscribers can unsubscribe without logging in. Newsletter footers contain a link, and supported mail providers can perform RFC 8058 one-click unsubscribe. An ordinary link GET never mutates the subscription; a POST is required.
6. Unsubscribe skips queued newsletter messages and leaves volunteer commitments/essential transaction notices unchanged. A provider request already in flight may still complete.
7. Active addresses are never sent repeated signup confirmations. Pending/unsubscribed requests have a one-hour per-address confirmation cooldown plus a shared per-IP rate limit. A later resubscribe request rotates the confirmation token and requires fresh consent; old links cannot reactivate an unsubscribed address. Suppressed addresses remain suppressed.

Responses do not reveal whether an address was previously subscribed. Subscription tokens are private random capabilities; do not publish them or subscriber records.

## Leadership workflow

Open `/admin/newsletters` (also linked from the private dashboard). The role check is the same as existing administrator access for both approved leadership accounts.

- Write the subject and message, review the branded preview, and **Save newsletter draft**. Saving sends nothing.
- Review the confirmed-subscriber count and settings. Only confirmed active subscribers are eligible. Queue a saved draft explicitly, confirming the reviewed audience. Queuing freezes the campaign and does not send mail.
- Choose **Send next newsletter batch** to send up to three messages. Repeat while items remain, respecting provider quota. Campaigns do not auto-send when a volunteer submits an unrelated application.
- Confirmation emails are processed automatically after signup when configured. The dashboard can retry confirmation batches separately.
- Subscriber lists are private and limited to the most recent 100 in this view. The latest 30 campaigns are shown. The initial campaign queue caps an audience at 1,000; larger lists require a managed bulk worker rather than silently excluding recipients.
- Counts labeled provider-accepted indicate API acceptance, not inbox delivery. Verify receipt, spam placement, bounces, and provider logs separately.

Claims are atomic and reuse stable provider idempotency keys. Known failed attempts retry after a delay, up to three attempts. Lost-response/interrupted sends retain their first-attempt time. Recovery stays within a conservative 23-hour provider idempotency window; older or exhausted uncertain sends require provider verification and are not blindly resent. No scheduler/continuous worker is installed. The dashboard initiates batches manually.

## Test before public use

Use only test recipients you control while configuring the test sender. Verify an actual received confirmation, pending-to-active transition, draft preview, delivery to an opted-in address, rendered footer address, and both ordinary and one-click unsubscribe. Confirm an unconfirmed/unsubscribed address is excluded and that essential volunteer notices still work. Check that a volunteer/donor who never opted in is absent from the newsletter audience.

Configure and verify provider-level bounce/complaint suppression before real campaigns. Automatic Resend bounce/complaint-to-database synchronization is not implemented in this increment; authorized operators can use the private subscriber `suppressed` status to exclude a problematic address. Marketing automation, scheduled broadcasts, campaign analytics, attachment/media editing, subscriber self-service editing, and a dedicated retention/deletion UI remain follow-up work. Review privacy/legal disclosures, mailing address, and an appropriate consent/data-retention policy before real public intake. Do not import contacts without their permission.

## Local validation

The additive migration was executed in an isolated PostgreSQL container with test-only Supabase role names and `auth.users`. Run core tests with `npm test`; database tests require a **dedicated** local `tskangel-*-test` container initialized with both migrations and `TEST_DB_CONTAINER` / `NEWSLETTER_TEST_DB_CONTAINER`. Never run the fixture tests on the live Supabase project.

This verifies database semantics, not actual Resend inbox delivery or hosted Supabase authentication. Actual delivery remains pending until the account and sender are securely connected.
