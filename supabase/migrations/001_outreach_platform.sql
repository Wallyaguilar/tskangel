-- Run once in the Supabase SQL editor. All application tables are server-only.
create extension if not exists pgcrypto;
create table public.administrators (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.site_content (id integer primary key check(id=1), mission text not null, vision text not null);
insert into public.site_content values (1,'To demonstrate the love of Jesus Christ through acts of compassion, service, and community outreach, providing practical support and meaningful connection to individuals and families facing hardship.','To build communities where compassion becomes action, people are treated with dignity, and the love of Christ is demonstrated through service.');
create table public.volunteer_applications (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 full_name text not null, email text not null unique, application_data jsonb not null,
 status text not null default 'pending' check(status in ('pending','approved','declined')), internal_notes text not null default ''
);
create table public.outreach_events (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null,
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at), time_zone text not null,
 public_location text not null, private_instructions text not null default '', capacity integer not null check(capacity>0),
 registration_deadline timestamptz, organizer_contact text not null default '',
 status text not null check(status in ('Scheduled','Tentative','Postponed','Rescheduled','Canceled','Completed')),
 published boolean not null default false, registration_open boolean not null default false,
 revision integer not null default 0, updated_at timestamptz not null default now(),
 check(registration_deadline is null or registration_deadline<=starts_at)
);
create table public.event_registrations (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.outreach_events(id),
 full_name text not null, email text not null, availability text not null default '',
 status text not null default 'pending' check(status in ('pending','approved','canceled','declined')),
 cancel_token text not null unique default encode(gen_random_bytes(32),'hex'), created_at timestamptz not null default now()
);
create unique index one_active_registration on public.event_registrations(event_id,email) where status in ('pending','approved');
create table public.email_outbox (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 kind text not null, to_email text, payload jsonb not null, status text not null default 'pending' check(status in ('pending','sent')),
 provider_id text, last_attempt_at timestamptz
);
create table public.audit_log (
 id bigint generated always as identity primary key, at timestamptz not null default now(), actor uuid,
 action text not null, record_id text, changes jsonb
);
create table public.rate_limits (key text primary key, started_at timestamptz not null, attempts integer not null);
create table public.stripe_events (id text primary key, received_at timestamptz not null default now());
create table public.donations (
 external_id text primary key, event_id text not null, amount_cents integer not null, currency text not null,
 frequency text not null, status text not null, customer_id text, subscription_id text,
 created_at timestamptz not null default now(), livemode boolean not null default false check(livemode=false)
);

-- RLS and explicit grants prevent public and signed-in browser access, including PII.
do $$ declare t text; begin
 foreach t in array array['administrators','site_content','volunteer_applications','outreach_events','event_registrations','email_outbox','audit_log','rate_limits','stripe_events','donations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;

create function public.take_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 insert into rate_limits(key,started_at,attempts) values(p_key,now(),1)
 on conflict(key) do update set attempts=case when rate_limits.started_at < now()-make_interval(secs=>p_seconds) then 1 else rate_limits.attempts+1 end,
 started_at=case when rate_limits.started_at < now()-make_interval(secs=>p_seconds) then now() else rate_limits.started_at end returning attempts into n;
 return n<=p_limit;
end $$;

create function public.application_emails() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' then
 insert into email_outbox(kind,to_email,payload) values('application_received',new.email,jsonb_build_object('name',new.full_name));
 insert into email_outbox(kind,to_email,payload) values('admin_application',null,jsonb_build_object('id',new.id));
 elsif new.status is distinct from old.status then
 insert into email_outbox(kind,to_email,payload) values('application_status',new.email,jsonb_build_object('status',new.status));
 end if;
 return new;
end $$;
create trigger application_notifications after insert or update on public.volunteer_applications for each row execute function public.application_emails();

create function public.event_revision() returns trigger language plpgsql set search_path=public as $$
begin
 if new.capacity < (select count(*) from event_registrations where event_id=new.id and status in ('pending','approved')) then raise exception 'Capacity cannot be below reserved places';end if;
 new.revision=old.revision+1;new.updated_at=now();return new;end $$;
create trigger update_event_revision before update on public.outreach_events for each row execute function public.event_revision();
create function public.event_updates() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if row(new.title,new.description,new.starts_at,new.ends_at,new.public_location,new.status,new.published) is distinct from row(old.title,old.description,old.starts_at,old.ends_at,old.public_location,old.status,old.published) then
 insert into audit_log(action,record_id,changes) values('event_changed',new.id::text,jsonb_build_object('before',to_jsonb(old)-'private_instructions','after',to_jsonb(new)-'private_instructions'));
 insert into email_outbox(kind,to_email,payload)
 select 'event_changed',r.email,jsonb_build_object('eventId',new.id,'title',new.title,'startsAt',new.starts_at,'endsAt',new.ends_at,'timeZone',new.time_zone,'location',new.public_location,'status',new.status,'published',new.published,'before',jsonb_build_object('startsAt',old.starts_at,'endsAt',old.ends_at,'location',old.public_location,'status',old.status,'published',old.published),'cancelToken',r.cancel_token)
 from event_registrations r where r.event_id=new.id and r.status in ('pending','approved');
 end if;
 return new;
end $$;
create trigger notify_event_changes after update on public.outreach_events for each row execute function public.event_updates();

create function public.register_for_event(p_event uuid,p_name text,p_email text,p_availability text) returns text language plpgsql security definer set search_path=public as $$
declare e outreach_events; n integer; reg event_registrations;
begin
 select * into e from outreach_events where id=p_event for update;
 if not found or not e.published or not e.registration_open or e.status not in ('Scheduled','Rescheduled') or e.starts_at<=now() or (e.registration_deadline is not null and e.registration_deadline<now()) then return 'closed';end if;
 -- Return a generic result for duplicates; never disclose a person's registration.
 if exists(select 1 from event_registrations where event_id=p_event and email=p_email and status in ('pending','approved')) then return 'received';end if;
 select count(*) into n from event_registrations where event_id=p_event and status in ('pending','approved');
 if n>=e.capacity then return 'full';end if;
 insert into event_registrations(event_id,full_name,email,availability) values(p_event,p_name,p_email,p_availability) returning * into reg;
 insert into email_outbox(kind,to_email,payload) values('registration_received',p_email,jsonb_build_object('eventId',e.id,'title',e.title,'startsAt',e.starts_at,'endsAt',e.ends_at,'timeZone',e.time_zone,'location',e.public_location,'status',e.status,'cancelToken',reg.cancel_token));
 return 'received';
end $$;
create function public.cancel_registration(p_token text) returns boolean language plpgsql security definer set search_path=public as $$
declare reg event_registrations;
begin
 update event_registrations set status='canceled' where cancel_token=p_token and status in ('pending','approved') returning * into reg;
 if not found then return false;end if;
 insert into email_outbox(kind,to_email,payload) values('registration_canceled',reg.email,jsonb_build_object('eventId',reg.event_id));return true;
end $$;
create function public.registration_status_email() returns trigger language plpgsql security definer set search_path=public as $$
declare e outreach_events;
begin
 if new.status is distinct from old.status and new.status in ('approved','declined') then
 select * into e from outreach_events where id=new.event_id;
 insert into email_outbox(kind,to_email,payload) values('registration_reviewed',new.email,jsonb_build_object('eventId',e.id,'title',e.title,'status',new.status,'privateInstructions',case when new.status='approved' then e.private_instructions else '' end,'cancelToken',new.cancel_token));
 end if;return new;
end $$;
create trigger registration_review after update on public.event_registrations for each row execute function public.registration_status_email();

create function public.record_test_donation(p_event text,p_external text,p_amount integer,p_currency text,p_frequency text,p_status text,p_customer text,p_subscription text) returns boolean language plpgsql security definer set search_path=public as $$
begin
 insert into stripe_events(id) values(p_event) on conflict do nothing;
 if not found then return false;end if;
 insert into donations(external_id,event_id,amount_cents,currency,frequency,status,customer_id,subscription_id)
 values(p_external,p_event,p_amount,p_currency,p_frequency,p_status,p_customer,p_subscription)
 on conflict(external_id) do update set status=case when donations.status in ('refunded','partially_refunded') then donations.status when excluded.status='failed' and donations.status='completed' then donations.status else excluded.status end,event_id=excluded.event_id,amount_cents=excluded.amount_cents;
 return true;
end $$;

-- Postgres grants EXECUTE to PUBLIC by default. Restrict every application function.
do $$ declare fn record; begin
 for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('take_rate_limit','application_emails','event_revision','event_updates','register_for_event','cancel_registration','registration_status_email','record_test_donation') loop
 execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
 execute format('grant execute on function %s to service_role',fn.signature);
 end loop;
end $$;
