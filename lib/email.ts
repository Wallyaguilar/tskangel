import { emailReplyTo } from './email-settings';
import { database } from './data';
import { operationalEmail } from './operational-email';
export function emailReady(){try{emailReplyTo();return Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM&&process.env.SITE_URL);}catch{return false;}}
export async function sendQueuedEmails(onlyId?:string){
  if(!emailReady())return {sent:0,pending:true};
  const db=database();let query=db.from('email_outbox').select('*').eq('status','pending');if(onlyId)query=query.eq('id',onlyId);const {data,error}=await query.order('created_at').limit(onlyId?1:15);
  if(error)return {sent:0,pending:true};let sent=0;
  for(const row of data||[]){
    const to=row.to_email||process.env.ADMIN_NOTIFICATION_EMAIL;if(!to)continue;
    const p=row.payload;const base=process.env.SITE_URL!.replace(/\/$/,'');
    const content=operationalEmail(row.kind,p,base);if(!content)continue;
    await db.from('email_outbox').update({last_attempt_at:new Date().toISOString()}).eq('id',row.id);
    try{
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':row.id},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],...(emailReplyTo()?{reply_to:emailReplyTo()}:{}),...content}),signal:AbortSignal.timeout(10000)});
      if(!response.ok)continue;const message=await response.json();
      const {error:saveError}=await db.from('email_outbox').update({status:'sent',provider_id:message.id}).eq('id',row.id);if(!saveError)sent++;
    }catch{/* Leave the durable outbox item pending for an administrator to retry. */}
  }
  return {sent,pending:true};
}
