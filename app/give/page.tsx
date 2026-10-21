import type { Metadata } from 'next';
import SiteShell from '../components/site-shell';
import DonationForm from './donation-form';
import CheckoutResult from './checkout-result';
import Link from 'next/link';
import { paymentsReady } from '@/lib/payments';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Support Our Mission | TskAngel',referrer:'no-referrer'};
export default async function GivePage({searchParams}:{searchParams:Promise<{checkout?:string;session_id?:string}>}){
 const {checkout,session_id}=await searchParams;
 const returning=checkout==='returned';
 const validSession=session_id&&/^cs_test_[a-zA-Z0-9_]{10,240}$/.test(session_id)?session_id:undefined;
 const rawPortal=process.env.STRIPE_CUSTOMER_PORTAL_URL;let portal:string|undefined;
 try{const url=new URL(rawPortal||'');if(url.protocol==='https:'&&url.hostname==='billing.stripe.com'&&url.pathname.startsWith('/p/login/test_'))portal=url.href;}catch{}
 return <SiteShell>{(returning||checkout==='canceled')&&<div className="wrap checkout-feedback"><CheckoutResult sessionId={validSession} canceled={checkout==='canceled'}/></div>}<section className="page-heading wrap"><p className="eyebrow">GENEROSITY BECOMES PRACTICAL CARE</p><h1>Your generosity<br/>helps us serve.</h1><p className="lead">Donations help provide meals, essential supplies, and practical assistance to neighbors experiencing hardship.</p></section><section className="page-content wrap giving-layout"><div><aside className="notice"><strong>Development preview · Test mode only</strong><p>Live payment processing is disabled. Test gifts do not move real money or create a tax receipt.</p></aside><h2>Make a difference<br/>for $10 a month.</h2><p>A monthly commitment starting at just $10 helps TskAngel plan ahead, purchase essential supplies, and continue serving our neighbors.</p><p>TskAngel’s outreach is made possible through donations and the dedication of volunteers. Your generosity helps us purchase meals, essential supplies, and other resources needed to serve our communities.</p><aside className="notice"><strong>Donation disclosure — draft for review</strong><p>TskAngel’s legal registration and federal tax-exempt status have not been verified. We do not claim that contributions are tax-deductible. Legal disclosures, processor eligibility, and bank payout setup require approval before live giving.</p></aside>{portal?<a className="text-link" href={portal} target="_blank" rel="noreferrer">Manage a test monthly gift with Stripe →</a>:<p className="small">Recurring donor management will open through Stripe’s secure portal after its test login link is configured.</p>}</div><div>{returning?<aside className="notice"><strong>Your checkout result is shown above.</strong><p>Please confirm that result before starting another test gift.</p><Link href="/give" className="text-link">Back to giving options →</Link></aside>:<DonationForm ready={paymentsReady()}/>}</div></section></SiteShell>;
}
