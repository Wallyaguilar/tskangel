-- Additive newsletter setup: run once AFTER 001_outreach_platform.sql.
-- Never imports volunteer or donor addresses into the newsletter audience.
create table public.newsletter_subscribers (
 id uuid primary key default gen_random_uuid(), email text not null unique,
 name text not null default '', status text not null default 'pending' check(status in ('pending','active','unsubscribed','suppressed')),
 consent_text text not null, consent_version text not null, consent_source text not null default '/newsletter',
 requested_at timestamptz not null default now(), confirmed_at timestamptz, unsubscribed_at timestamptz,
 confirm_token text unique default encode(gen_random_bytes(32),'hex'), confirm_expires_at timestamptz not null default now()+interval '48 hours',
 unsubscribe_token text not null unique default encode(gen_random_bytes(32),'hex')
);
create table public.newsletter_campaigns (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 created_by uuid not null references auth.users(id), subject text not null, body text not null,
 status text not null default 'draft' check(status in ('draft','queued')), queued_at timestamptz
);
create table public.newsletter_messages (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
 campaign_id uuid references public.newsletter_campaigns(id), kind text not null check(kind in ('confirmation','campaign')),
 payload jsonb not null default '{}', status text not null default 'queued' check(status in ('queued','sending','sent','skipped','failed','uncertain')),
 attempts integer not null default 0, next_attempt_at timestamptz not null default now(), claimed_at timestamptz, first_attempt_at timestamptz,
 provider_id text, sent_at timestamptz, unique(campaign_id,subscriber_id),
 check((kind='campaign' and campaign_id is not null) or (kind='confirmation' and campaign_id is null))
);
create index newsletter_message_queue on public.newsletter_messages(kind,status,next_attempt_at);
do $$ declare t text;begin
 foreach t in array array['newsletter_subscribers','newsletter_campaigns','newsletter_messages'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;

create function public.request_newsletter(p_email text,p_name text,p_consent text,p_version text) returns boolean language plpgsql security definer set search_path=public as $$
declare fresh uuid;s newsletter_subscribers;
begin
 insert into newsletter_subscribers(email,name,consent_text,consent_version)
 values(lower(trim(p_email)),p_name,p_consent,p_version) on conflict(email) do nothing returning id into fresh;
 select * into s from newsletter_subscribers where email=lower(trim(p_email)) for update;
 if fresh is null then
  if s.status in ('active','suppressed') or s.requested_at>now()-interval '1 hour' then return true;end if;
  update newsletter_subscribers set name=p_name,status='pending',consent_text=p_consent,consent_version=p_version,
  requested_at=now(),confirmed_at=null,confirm_token=encode(gen_random_bytes(32),'hex'),confirm_expires_at=now()+interval '48 hours'
  where id=s.id returning * into s;
 end if;
 insert into newsletter_messages(subscriber_id,kind,payload) values(s.id,'confirmation',jsonb_build_object('token',s.confirm_token));
 return true;
end $$;
create function public.confirm_newsletter(p_token text) returns text language plpgsql security definer set search_path=public as $$
declare s newsletter_subscribers;
begin
 select * into s from newsletter_subscribers where confirm_token=p_token for update;
 if not found or s.status not in ('pending','active') then return 'invalid';end if;
 if s.status='active' then return 'confirmed';end if;
 if s.confirm_expires_at<now() then return 'expired';end if;
 update newsletter_subscribers set status='active',confirmed_at=now(),unsubscribed_at=null where id=s.id;
 return 'confirmed';
end $$;
create function public.unsubscribe_newsletter(p_token text) returns boolean language plpgsql security definer set search_path=public as $$
declare subscriber uuid;
begin
 update newsletter_subscribers set status='unsubscribed',unsubscribed_at=coalesce(unsubscribed_at,now()),confirm_token=null
 where unsubscribe_token=p_token and status<>'suppressed' returning id into subscriber;
 if subscriber is null then return false;end if;
 update newsletter_messages set status='skipped' where subscriber_id=subscriber and status='queued';return true;
end $$;
create function public.queue_newsletter(p_campaign uuid,p_actor uuid) returns integer language plpgsql security definer set search_path=public as $$
declare c newsletter_campaigns;n integer;
begin
 if not exists(select 1 from administrators where user_id=p_actor) then raise exception 'Administrator required';end if;
 select * into c from newsletter_campaigns where id=p_campaign for update;
 if not found then raise exception 'Campaign not found';end if;
 if c.status='queued' then select count(*) into n from newsletter_messages where campaign_id=c.id;return n;end if;
 select count(*) into n from newsletter_subscribers where status='active';
 if n=0 then return 0;end if;
 if n>1000 then raise exception 'Use a managed bulk delivery worker for more than 1000 recipients';end if;
 insert into newsletter_messages(subscriber_id,campaign_id,kind) select id,c.id,'campaign' from newsletter_subscribers where status='active';
 update newsletter_campaigns set status='queued',queued_at=now() where id=c.id;
 insert into audit_log(actor,action,record_id,changes) values(p_actor,'newsletter_queued',c.id::text,jsonb_build_object('recipients',n));return n;
end $$;
-- Atomic claims prevent two dashboard tabs from sending the same item concurrently.
-- Recovery reuses the same provider idempotency key only within its safe window.
create function public.claim_newsletter_message(p_kind text) returns setof public.newsletter_messages language plpgsql security definer set search_path=public as $$
begin
 update newsletter_messages set status='uncertain' where kind=p_kind and status in ('sending','queued') and first_attempt_at<now()-interval '23 hours';
 update newsletter_messages set status='uncertain' where kind=p_kind and status='sending' and claimed_at<now()-interval '2 minutes' and attempts>=3;
 update newsletter_messages set status='queued',next_attempt_at=now() where kind=p_kind and status='sending' and claimed_at<now()-interval '2 minutes' and first_attempt_at>=now()-interval '23 hours' and attempts<3;
 update newsletter_messages m set status='skipped' from newsletter_subscribers s where m.subscriber_id=s.id and m.status='queued' and m.kind=p_kind
 and ((m.kind='campaign' and s.status<>'active') or (m.kind='confirmation' and (s.status<>'pending' or s.confirm_expires_at<now() or (m.payload->>'token') is distinct from s.confirm_token)));
 return query update newsletter_messages set status='sending',attempts=attempts+1,claimed_at=now(),first_attempt_at=coalesce(first_attempt_at,now())
 where id=(select id from newsletter_messages where kind=p_kind and status='queued' and attempts<3 and next_attempt_at<=now() order by created_at limit 1 for update skip locked)
 returning *;
end $$;
-- A queued campaign is immutable: edits apply only to drafts, including direct SQL.
create function public.freeze_queued_newsletter() returns trigger language plpgsql set search_path=public as $$
begin if old.status='queued' then raise exception 'Queued campaigns cannot be edited';end if;return new;end $$;
create trigger freeze_newsletter before update on public.newsletter_campaigns for each row execute function public.freeze_queued_newsletter();
do $$ declare fn record;begin
 for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('request_newsletter','confirm_newsletter','unsubscribe_newsletter','queue_newsletter','claim_newsletter_message','freeze_queued_newsletter') loop
 execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
 execute format('grant execute on function %s to service_role',fn.signature);
 end loop;
end $$;
