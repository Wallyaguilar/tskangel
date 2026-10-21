import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteShell from '@/app/components/site-shell';
import { administrator } from '@/lib/auth';
import { database } from '@/lib/data';
import { newsletterSendingReady,newsletterSignupReady } from '@/lib/newsletter-server';
import { NewsletterActions,NewsletterDelivery,NewsletterEditor } from './newsletter-tools';
export const dynamic='force-dynamic';
export const metadata={title:'Newsletter Workspace | TskAngel',robots:{index:false,follow:false}};
export default async function NewsletterAdmin(){if(!await administrator())redirect('/admin/login');const db=database();
 const [campaigns,subscribers,active,queued,sent,failed,uncertain]=await Promise.all([
  db.from('newsletter_campaigns').select('id,subject,body,status,created_at').order('created_at',{ascending:false}).limit(30),
  db.from('newsletter_subscribers').select('id,name,email,status,requested_at,confirmed_at').order('requested_at',{ascending:false}).limit(100),
  db.from('newsletter_subscribers').select('id',{count:'exact',head:true}).eq('status','active'),
  db.from('newsletter_messages').select('id',{count:'exact',head:true}).in('status',['queued','sending']),
  db.from('newsletter_messages').select('id',{count:'exact',head:true}).eq('status','sent'),
  db.from('newsletter_messages').select('id',{count:'exact',head:true}).eq('status','failed'),
  db.from('newsletter_messages').select('id',{count:'exact',head:true}).eq('status','uncertain'),
 ]);const broken=[campaigns,subscribers,active,queued,sent,failed,uncertain].some(r=>r.error),ready=newsletterSendingReady(),signupReady=newsletterSignupReady(),address=process.env.NEWSLETTER_POSTAL_ADDRESS?.trim()||'';
 return <SiteShell><section className="wrap page-heading"><Link href="/admin" className="text-link">← Leadership dashboard</Link><p className="eyebrow">OPT-IN UPDATES. MEANINGFUL CONNECTION.</p><h1>News from the heart.</h1><p className="lead">Prepare and send updates to people who have confirmed they want to hear from TskAngel.</p></section><section className="wrap page-content">{broken?<p className="setup-notice" role="alert">The newsletter tables could not load. Run the additive 002_newsletters.sql migration once, or check the database connection. No audience counts can be verified until this is fixed.</p>:<><div className="admin-summary"><article><strong>{active.count??'—'}</strong><span>Confirmed subscribers</span></article><article><strong>{queued.count??'—'}</strong><span>Queued or processing messages (all types)</span></article><article><strong>{sent.count??'—'}</strong><span>Provider-accepted messages (all types)</span></article></div><aside className="notice"><strong>Delivery setup</strong><p>{signupReady?'Email configuration is present; verify actual inbox delivery.':'Connect Resend, EMAIL_FROM, and SITE_URL before accepting signups or sending confirmation emails.'} {address?'A public mailing address is configured.':'Add an approved public NEWSLETTER_POSTAL_ADDRESS before sending newsletters. A suitable organization address or PO box can be used; this will appear in every newsletter.'}</p><p>Newsletters require separate confirmed opt-in. Volunteers and donors are not imported. Campaigns are sent only when you explicitly queue and send them.</p></aside>
 <section className="admin-section"><h2>Create a newsletter</h2><NewsletterEditor address={address}/></section><section className="admin-section"><h2>Saved newsletters</h2><p>Review each draft before queuing it. Queuing freezes its content and snapshots the confirmed audience; new subscribers are not added to that campaign afterward. Unsubscribed recipients are skipped before sending. Showing the latest 30.</p>{campaigns.data?.map(c=><details className="admin-record" key={c.id}><summary>{c.subject} · {c.status}</summary>{c.status==='draft'?<><NewsletterEditor campaign={c} address={address}/><NewsletterActions campaignId={c.id} active={active.count||0} ready={ready}/></>:<p className="preserve-lines">{c.body}</p>}</details>)}</section>
 <section className="admin-section"><h2>Send reviewed updates</h2><p>Failed: {failed.count||0}. Interrupted messages requiring provider verification: {uncertain.count||0}. Review provider logs before re-creating a campaign or contacting a subscriber again.</p><NewsletterDelivery ready={ready} confirmationReady={signupReady}/></section>
 <section className="admin-section"><h2>Newsletter audience</h2><p>Latest 100 opt-in records. Active means the owner confirmed their address. Pending addresses do not receive campaigns.</p><div className="responsive-table"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead><tbody>{subscribers.data?.map(s=><tr key={s.id}><td>{s.name||'Not supplied'}</td><td>{s.email}</td><td>{s.status}</td></tr>)}</tbody></table></div><Link href="/newsletter" className="text-link">Open public newsletter signup →</Link></section></>}
 </section></SiteShell>;
}
