# Growth and Microsoft 365 integration direction

This is an implementation roadmap, not a claim that Microsoft services are already connected or that a hosting plan has guaranteed capacity. No DNS, mailbox, document, permission, paid plan, live payment or deployment-domain changes are authorized by this document.

## Keep clear systems of record

- **Next.js on Vercel:** responsive public pages and server-side application APIs. Keep administration private; load only the active section. Verify the selected Vercel plan's eligibility for this organization before launch.
- **Supabase Postgres:** structured website records: applications, events, registrations, newsletter consent, approved testimonials, donation status and audit records. Older applications remain searchable here rather than being moved to document files or email inboxes. Database roles and server-side authorization protect this data.
- **Stripe:** card/payment data, subscriptions, refunds and payouts. Keep test/live credentials and webhook records clearly separated before any approved live transition; the current schema explicitly rejects live donation rows.
- **Resend:** queued transactional messages and separately opted-in newsletter delivery. Domain verification, real recipient deliverability, webhook feedback and marketing compliance still need launch review. Continue respecting existing mailbox/DNS services.
- **Microsoft 365, subject to license and tenant configuration:** leadership mailbox and shared operational documents. A Microsoft business account alone does not establish Exchange Online mailbox, SharePoint, or Graph permissions; confirm the exact plan first.

## Useful Microsoft additions

1. **Ministry mailbox:** if Exchange Online is included, an approved address/shared mailbox can receive inquiries and leadership notifications. A shared mailbox, its delegates and sending rights must be configured by the tenant administrator. Configure website Reply-To to the approved monitored mailbox in a later change; it is not implemented just by writing this document. Microsoft staff mailbox service and a transactional sender can coexist without replacing existing mail-routing records.
2. **Shared document library:** use an organization-owned SharePoint team library for outreach plans, approved media and private consent documentation if included. Prefer this over one administrator's personal OneDrive. Keep volunteer contact databases in Supabase. A document library is not the website's transactional database, a database backup strategy, or a public image hosting replacement.
3. **Optional website integration:** Microsoft Graph can later link approved library files or send narrowly scoped staff correspondence. It needs an Entra app registration, tenant-admin consent, server-only credentials and permission scoping to the intended mailbox/site where supported. Do not default to tenant-wide mail/files access. Define exactly which files or messages should synchronize, the system of record, conflict/retry behavior, and retention before implementation. No Graph app or sync is implemented yet.

Microsoft mailboxes are appropriate for ordinary staff communication, subject to plan limits; they should not be assumed to replace a bulk newsletter provider. Keep unsubscribe/suppression and separate consent controls even if delivery providers change. No new Microsoft subscription is necessary until existing license capabilities have been confirmed.

## Growth work to complete before and after launch

- **Baseline measurements:** real mobile load times, image bytes, page performance, database query duration, server error rate, and delivery latency on the configured preview. The current local checks are functional/accessibility checks, not a hosted load test or capacity guarantee. Test a representative isolated database with synthetic data; never seed fabricated public records in the real ministry database.
- **Queue processing:** email queues persist, but processing currently follows actions/manual batches. Add an authenticated scheduled worker, bounded batches, retries/backoff, dead-letter/uncertain states, provider feedback and alerts before promising unattended high-volume delivery. Newsletter provider acceptance is not proof of inbox delivery. Do not send mass campaigns through a staff mailbox to bypass service limits.
- **Database:** existing summaries aggregate on the server, lists paginate and key date/status queries have indexes. Add full-text/trigram indexes when substring searches grow costly; use cursor pagination for deep archives and paginate remaining event/registration management lists. Large aggregate counts may later use scheduled summaries. Measure before partitioning or adding infrastructure.
- **Media:** optimize current large PNG illustrations; use responsive delivery, appropriate modern formats and caching. Add authenticated upload validation, ownership/consent checks and private access for sensitive assets. Public approved media and private consent records need distinct access rules.
- **Reliability:** define monitoring/alerts, service quotas, expected peak traffic, backup coverage, retention and restore drills. Confirm Supabase plan backup/PITR capabilities; do not assume the free plan supplies the desired recovery guarantees. Store secrets in the host's secret settings and rotate them under an agreed procedure.
- **Isolation:** the current Vercel preview uses the configured Supabase project. Before public launch, decide on separate development/staging/production data and payment/email settings, consistent migrations, and rollback procedures. Do not run load tests or migration experiments against private real submissions.

This architecture can expand without moving all records to another platform. Capacity will depend on actual traffic, data volumes, query patterns, provider quotas and chosen plans; upgrade only after review and approval.
