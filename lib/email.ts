import { database } from './data';
export function emailReady(){return Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM&&process.env.SITE_URL);}
export async function sendQueuedEmails(){
  if(!emailReady())return {sent:0,pending:true};
  const db=database();const {data,error}=await db.from('email_outbox').select('*').eq('status','pending').order('created_at').limit(15);
  if(error)return {sent:0,pending:true};let sent=0;
  for(const row of data||[]){
    const to=row.to_email||process.env.ADMIN_NOTIFICATION_EMAIL;if(!to)continue;
    const p=row.payload;const base=process.env.SITE_URL!.replace(/\/$/,'');
    let subject='TskAngel update',text='';
    if(row.kind==='application_received'){subject='Thank you for your willingness to serve!';text=`Thank you, ${p.name}. We received your TskAngel volunteer application. Our team will review your information and contact you about upcoming opportunities. This is not an event placement or approval. You have not been added to a marketing list.`;}
    if(row.kind==='admin_application'){subject='A volunteer application is ready for review';text=`Sign in to your private dashboard to review the application: ${base}/admin`;}
    if(row.kind==='application_status'){subject='Your TskAngel volunteer application';text=`Your application status is now ${p.status}. Thank you for your willingness to serve.`;}
    if(row.kind==='registration_received'||row.kind==='event_changed'){
      subject=row.kind==='event_changed'?`Outreach update: ${p.title}`:`Registration received: ${p.title}`;
      const time=(v:string)=>new Intl.DateTimeFormat('en-US',{dateStyle:'full',timeStyle:'short',timeZone:p.timeZone}).format(new Date(v));
      text=`${row.kind==='registration_received'?'Your registration is pending administrator approval.':'The event details have changed.'}\n${p.title}\n${time(p.startsAt)} – ${time(p.endsAt)} (${p.timeZone})\nPublic location: ${p.location}\nEvent status: ${p.status}\n`;
      if(p.before)text+=`Previously: ${time(p.before.startsAt)} – ${time(p.before.endsAt)}; ${p.before.location}; ${p.before.status}.\n`;
      if(p.published===false)text+='This event is no longer publicly listed. Please contact the organizer before attending.\n';
      text+=`Latest details: ${base}/calendar${p.published===false?'':'/'+p.eventId}\nCancel your registration: ${base}/registration/cancel?token=${encodeURIComponent(p.cancelToken)}\nDates, times, and locations may change. Please check the latest calendar before attending.`;
    }
    if(row.kind==='registration_reviewed'){subject=`Registration ${p.status}: ${p.title}`;text=`Your registration is ${p.status}.\n${p.privateInstructions||''}\nLatest details: ${base}/calendar/${p.eventId}\nCancel: ${base}/registration/cancel?token=${encodeURIComponent(p.cancelToken)}\nPlease recheck event details before attending.`;}
    if(row.kind==='registration_canceled'){subject='Your event registration was canceled';text=`Your place has been released. Thank you for letting us know. Upcoming events: ${base}/calendar`;}
    if(!text)continue;
    await db.from('email_outbox').update({last_attempt_at:new Date().toISOString()}).eq('id',row.id);
    try{
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':row.id},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],subject,text}),signal:AbortSignal.timeout(10000)});
      if(!response.ok)continue;const message=await response.json();
      const {error:saveError}=await db.from('email_outbox').update({status:'sent',provider_id:message.id}).eq('id',row.id);if(!saveError)sent++;
    }catch{/* Leave the durable outbox item pending for an administrator to retry. */}
  }
  return {sent,pending:true};
}
