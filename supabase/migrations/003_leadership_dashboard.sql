-- Additive: apply after 001 and 002. Safe to retry this update after its prerequisites exist.
-- All changes succeed together. Existing records are never deleted or moved.
begin;
do $$ begin
 if to_regclass('public.volunteer_applications') is null or to_regclass('public.donations') is null then
  raise exception 'Missing core website tables. Apply 001_outreach_platform.sql first.';
 end if;
 if to_regclass('public.newsletter_subscribers') is null or to_regclass('public.newsletter_campaigns') is null or to_regclass('public.newsletter_messages') is null then
  raise exception 'Newsletter setup is missing. Apply 002_newsletters.sql successfully, then run this complete 003 update again.';
 end if;
end $$;
create table if not exists public.testimonials (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null references auth.users(id),
 display_name text not null check(char_length(display_name) between 2 and 80),
 perspective text not null check(perspective in ('Volunteer','Community member')),
 quote text not null check(char_length(quote) between 20 and 2000),
 consent_confirmed boolean not null default false,
 consent_evidence text not null default '' check(char_length(consent_evidence)<=2000),
 published boolean not null default false,
 check(not published or (consent_confirmed and char_length(trim(consent_evidence))>=10))
);
alter table public.testimonials enable row level security;
revoke all on public.testimonials from public,anon,authenticated;
grant select,insert,update,delete on public.testimonials to service_role;
create index if not exists testimonials_public on public.testimonials(published,created_at desc);
-- Only the server service role may read aggregate private operational data.
create or replace function public.leadership_metrics() returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object(
 'pending',(select count(*) from volunteer_applications where status='pending'),
 'applications',(select count(*) from volunteer_applications),
 'subscribers',(select count(*) from newsletter_subscribers where status='active'),
 'newsletter_pending',(select count(*) from newsletter_subscribers where status='pending'),
 'donation_months',coalesce((select jsonb_agg(row_to_json(months) order by month,currency) from (
 select to_char(created_at at time zone 'UTC','YYYY-MM') as month,lower(currency) as currency,sum(amount_cents) as amount_cents,count(*) as count
 from donations where status='completed' and created_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'-interval '5 months'
 group by 1,2
 ) months),'[]'::jsonb))
$$;
revoke all on function public.leadership_metrics() from public,anon,authenticated;
grant execute on function public.leadership_metrics() to service_role;
-- Keep recent lists and status/date summaries efficient as private records grow.
create index if not exists volunteer_applications_recent on public.volunteer_applications(created_at desc,id);
create index if not exists volunteer_applications_status on public.volunteer_applications(status);
create index if not exists donations_completed_months on public.donations(created_at,currency) where status='completed';
create index if not exists newsletter_subscribers_status on public.newsletter_subscribers(status);
create index if not exists newsletter_subscribers_recent on public.newsletter_subscribers(requested_at desc,id);
create index if not exists outreach_events_upcoming on public.outreach_events(starts_at,ends_at);

commit;
