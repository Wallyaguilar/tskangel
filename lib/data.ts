import { createClient } from '@supabase/supabase-js';

export type OutreachEvent = { id:string; title:string; description:string; starts_at:string; ends_at:string; time_zone:string; public_location:string; capacity:number; registration_deadline:string|null; organizer_contact:string; status:string; registration_open:boolean; revision:number; updated_at:string; };
export const publicEventFields = 'id,title,description,starts_at,ends_at,time_zone,public_location,capacity,registration_deadline,organizer_contact,status,registration_open,revision,updated_at';
export const defaultContent = {
  mission:'To demonstrate the love of Jesus Christ through acts of compassion, service, and community outreach, providing practical support and meaningful connection to individuals and families facing hardship.',
  vision:'To build communities where compassion becomes action, people are treated with dignity, and the love of Christ is demonstrated through service.',
};
export const coreValues = [
  ['Faith','Our Christian beliefs inspire our commitment to serving others.'],
  ['Compassion','We approach every person with kindness, patience, understanding, and empathy.'],
  ['Dignity','Every individual deserves respect, regardless of their circumstances.'],
  ['Service','Meaningful change happens when people are willing to act.'],
  ['Community','We bring people together through relationships and shared responsibility.'],
  ['Stewardship','We responsibly manage donations, resources, supplies, and volunteer time.'],
] as const;
export const calendarDisclaimer = 'Outreach dates, times, and locations are subject to change based on available funding, volunteer schedules, weather, and other operational needs. We encourage all volunteers and participants to check our outreach calendar regularly or contact TskAngel to confirm event details before attending.';
export function databaseReady(){return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);}
export function database(){
  if(!databaseReady())throw new Error('SETUP_REQUIRED');
  return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function publicEvents():Promise<{events:OutreachEvent[];available:boolean}>{
  if(!databaseReady())return {events:[],available:false};
  const {data,error}=await database().from('outreach_events').select(publicEventFields).eq('published',true).order('starts_at');
  return {events:error?[]:data as OutreachEvent[],available:!error};
}
export async function publicEvent(id:string):Promise<OutreachEvent|null>{
  if(!/^[\da-f-]{36}$/i.test(id)||!databaseReady())return null;
  const {data,error}=await database().from('outreach_events').select(publicEventFields).eq('id',id).eq('published',true).maybeSingle();
  return error?null:data as OutreachEvent|null;
}
export async function siteContent(){
  if(!databaseReady())return defaultContent;
  const {data}=await database().from('site_content').select('mission,vision').eq('id',1).maybeSingle();
  return data||defaultContent;
}
export function eventDate(event:Pick<OutreachEvent,'starts_at'|'time_zone'>){return new Intl.DateTimeFormat('en-US',{dateStyle:'full',timeZone:event.time_zone}).format(new Date(event.starts_at));}
export function eventTime(event:Pick<OutreachEvent,'starts_at'|'ends_at'|'time_zone'>){const fmt=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZoneName:'short',timeZone:event.time_zone});return `${fmt.format(new Date(event.starts_at))} – ${fmt.format(new Date(event.ends_at))}`;}
