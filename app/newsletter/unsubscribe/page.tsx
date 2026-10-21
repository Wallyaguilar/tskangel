import SiteShell from '@/app/components/site-shell';
import SubscriptionAction from '../subscription-action';
import { newsletterTokenSchema } from '@/lib/newsletter';
export const metadata={title:'Unsubscribe From Newsletters | TskAngel',referrer:'no-referrer' as const,robots:{index:false,follow:false}};
export default async function Unsubscribe({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;const parsed=newsletterTokenSchema.safeParse(token);return <SiteShell><section className="wrap page-heading"><p className="eyebrow">YOU’RE ALWAYS IN CONTROL</p><h1>Manage your updates.</h1></section><section className="wrap narrow page-content">{parsed.success?<SubscriptionAction token={parsed.data} action="unsubscribe"/>:<p className="notice">Use the unsubscribe link in a TskAngel email. No subscription has been changed.</p>}</section></SiteShell>;}
