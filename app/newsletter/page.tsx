import SiteShell from '@/app/components/site-shell';
import NewsletterSignup from './signup-form';
import { newsletterSignupReady } from '@/lib/newsletter-server';
export const dynamic='force-dynamic';
export const metadata={title:'Stay Connected | TskAngel'};
export default function Newsletter(){return <SiteShell><section className="wrap page-heading"><p className="eyebrow">GOOD NEWS. SHARED PURPOSE.</p><h1>Stay close to<br/>the heart of our work.</h1><p className="lead">Receive ministry news, outreach updates, and opportunities to put compassion into action.</p></section><section className="wrap narrow page-content"><h2>News worth sharing.</h2><p>Sign up by choice, confirm by email, and unsubscribe whenever you wish. No donation or volunteer application is required.</p><NewsletterSignup ready={newsletterSignupReady()}/></section></SiteShell>;}
