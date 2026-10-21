import { database,databaseReady } from './data';
import { renderMinistryEmail } from './email-design';
import { emailReady } from './email';
import { newsletterContent } from './newsletter';
export function newsletterSignupReady(){return databaseReady()&&emailReady();}
export function newsletterSendingReady(){return newsletterSignupReady()&&Boolean(process.env.NEWSLETTER_POSTAL_ADDRESS?.trim());}
export async function deliverNewsletters(kind:'confirmation'|'campaign'){
 if(!newsletterSignupReady()||(kind==='campaign'&&!newsletterSendingReady()))return {accepted:0,pending:true};
 const db=database(),base=process.env.SITE_URL!.replace(/\/$/,'');let accepted=0;
 for(let count=0;count<3;count++){
  const {data:claimed,error}=await db.rpc('claim_newsletter_message',{p_kind:kind});if(error)throw new Error('NEWSLETTER_MIGRATION_REQUIRED');const message=claimed?.[0];if(!message)break;
  const {data:subscriber,error:subscriberError}=await db.from('newsletter_subscribers').select('email,status,confirm_token,confirm_expires_at,unsubscribe_token').eq('id',message.subscriber_id).maybeSingle();
  if(subscriberError){await db.from('newsletter_messages').update({status:message.attempts>=3?'failed':'queued',next_attempt_at:new Date(Date.now()+60000).toISOString()}).eq('id',message.id);break;}
  if(!subscriber||(kind==='campaign'?subscriber.status!=='active':subscriber.status!=='pending'||subscriber.confirm_token!==message.payload.token||new Date(subscriber.confirm_expires_at)<new Date())){await db.from('newsletter_messages').update({status:'skipped'}).eq('id',message.id);continue;}
  let content:{subject:string;text:string;html?:string;headers?:Record<string,string>};
  if(kind==='confirmation'){
   content=renderMinistryEmail({subject:'Confirm your TskAngel newsletter subscription',eyebrow:'ONE MORE STEP TO STAY CONNECTED',title:'Good news, by your choice.',paragraphs:['Please confirm that you want to receive TskAngel newsletters and outreach updates. You’ll be subscribed only after confirming.','If you didn’t request this, you can ignore this email. You won’t be added to the newsletter audience.'],notice:'Your confirmation link expires in 48 hours.',primary:{label:'Confirm my newsletter subscription',url:base+'/newsletter/confirm?token='+encodeURIComponent(message.payload.token)},footer:'This message responds to a newsletter signup request. Volunteering and giving do not subscribe you automatically.',footerLinks:[{label:'Stop this request or unsubscribe',url:base+'/newsletter/unsubscribe?token='+encodeURIComponent(subscriber.unsubscribe_token)}]});
  }else{
   const {data:campaign,error:campaignError}=await db.from('newsletter_campaigns').select('subject,body,status').eq('id',message.campaign_id).maybeSingle();
   if(campaignError){await db.from('newsletter_messages').update({status:message.attempts>=3?'failed':'queued',next_attempt_at:new Date(Date.now()+60000).toISOString()}).eq('id',message.id);break;}
   if(!campaign||campaign.status!=='queued'){await db.from('newsletter_messages').update({status:'skipped'}).eq('id',message.id);continue;}
   content=newsletterContent({...campaign,base,token:subscriber.unsubscribe_token,address:process.env.NEWSLETTER_POSTAL_ADDRESS!.trim()});
  }
  try{
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':message.id},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[subscriber.email],...content}),signal:AbortSignal.timeout(10000)});
   if(!response.ok){await db.from('newsletter_messages').update({status:message.attempts>=3?'failed':'queued',next_attempt_at:new Date(Date.now()+60000).toISOString()}).eq('id',message.id);continue;}
   const result=await response.json();const {error:recordError}=await db.from('newsletter_messages').update({status:'sent',provider_id:result.id,sent_at:new Date().toISOString()}).eq('id',message.id);if(!recordError)accepted++;
  }catch{
   // Delivery may have succeeded despite a lost response. Keep its stable key and
   // claim time so recovery stays within the provider's idempotency window.
   break;
  }
 }
 return {accepted,pending:true};
}
