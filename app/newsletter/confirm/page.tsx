import SiteShell from '@/app/components/site-shell';
import SubscriptionAction from '../subscription-action';
import { newsletterTokenSchema } from '@/lib/newsletter';
export const metadata={title:'Confirm Your Newsletter Subscription | TskAngel',referrer:'no-referrer' as const,robots:{index:false,follow:false}};
export default async function Confirm({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;const parsed=newsletterTokenSchema.safeParse(token);return <SiteShell><section className="wrap page-heading"><p className="eyebrow">YOUR CHOICE TO STAY CONNECTED</p><h1>Let’s make it official.</h1></section><section className="wrap narrow page-content">{parsed.success?<SubscriptionAction token={parsed.data} action="confirm"/>:<p className="notice">Use the confirmation link in your email. No subscription has been changed.</p>}</section></SiteShell>;}
