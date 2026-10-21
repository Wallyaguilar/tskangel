import type { Metadata } from 'next';
import SiteShell from '../components/site-shell';
import CalendarView from './calendar-view';
import { calendarDisclaimer, publicEvents } from '@/lib/data';
export const metadata:Metadata={title:'Outreach Calendar | TskAngel'};
export const dynamic='force-dynamic';
export default async function CalendarPage(){
 const {events,available}=await publicEvents();
 const initialMonth=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit'}).format(new Date());
 return <SiteShell><section className="page-heading wrap"><p className="eyebrow">PLAN YOUR NEXT ACT OF SERVICE</p><h1>Outreach calendar.</h1><p className="lead">Find an opportunity to serve, see the latest details, and make room for compassion.</p></section><section className="wrap page-content"><aside className="notice"><strong>Please check before attending.</strong><p>{calendarDisclaimer}</p></aside>{!available&&<p className="setup-notice" role="status">Our event database is not connected yet. The calendar controls work, but confirmed events will appear only after secure setup and administrator publication.</p>}<CalendarView events={events} initialMonth={initialMonth}/></section></SiteShell>;
}
