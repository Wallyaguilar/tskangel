import type { Metadata } from 'next';
import SiteShell from '../components/site-shell';
import ApplicationForm from './application-form';
import { databaseReady } from '@/lib/data';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Volunteer With Us | TskAngel'};
export default function VolunteerPage(){return <SiteShell><section className="page-heading wrap"><p className="eyebrow">YOUR GIFTS. OUR SHARED PURPOSE.</p><h1>Your time can<br/>make a difference.</h1><p className="lead">Whether you are an experienced volunteer or serving for the first time, you have something valuable to contribute.</p></section><section className="wrap page-content narrow"><ApplicationForm ready={databaseReady()}/></section></SiteShell>;}
