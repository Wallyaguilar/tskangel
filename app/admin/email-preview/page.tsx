import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteShell from '@/app/components/site-shell';
import { administrator } from '@/lib/auth';
import { emailReady } from '@/lib/email';
import { operationalEmail } from '@/lib/operational-email';
import PreviewTools from './preview-tools';
export const dynamic='force-dynamic';
export const metadata={title:'Email Design Preview | TskAngel',robots:{index:false,follow:false}};
export default async function EmailPreview(){if(!await administrator())redirect('/admin/login');const sample=operationalEmail('email_design_preview',{name:'Sample Volunteer'},process.env.SITE_URL||'https://tskangel.vercel.app')!;return <SiteShell><section className="wrap page-heading"><Link href="/admin" className="text-link">← Leadership dashboard</Link><p className="eyebrow">BRANDED COMMUNICATIONS</p><h1>A warmer welcome.</h1><p className="lead">Review the email layout before testing it in your inbox. It uses your approved colors and a plain-text fallback.</p></section><section className="wrap narrow page-content"><PreviewTools html={sample.html} ready={emailReady()}/><p className="small">The temporary sender address changes only after an approved sending domain is verified. Your email app controls its toolbar, avatar, and some dark-mode rendering. Original logo artwork is still awaiting a usable source file; this design uses a text heading.</p></section></SiteShell>;}
