import { redirect } from 'next/navigation';
import SiteShell from '@/app/components/site-shell';
import { administrator } from '@/lib/auth';
import { databaseReady } from '@/lib/data';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export const metadata={title:'Leadership Sign In | TskAngel',robots:{index:false,follow:false}};
export default async function Login(){if(await administrator())redirect('/admin');return <SiteShell><section className="wrap page-heading"><p className="eyebrow">PRIVATE LEADERSHIP ACCESS</p><h1>Welcome back.</h1></section><section className="wrap narrow page-content"><LoginForm ready={databaseReady()}/></section></SiteShell>;}
