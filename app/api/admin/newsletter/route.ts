import { after,NextResponse } from 'next/server';
import { z } from 'zod';
import { administrator } from '@/lib/auth';
import { database } from '@/lib/data';
import { newsletterDraftSchema } from '@/lib/newsletter';
import { newsletterSendingReady,newsletterSignupReady,deliverNewsletters } from '@/lib/newsletter-server';
import { errorResponse,sameOrigin,readBody } from '@/lib/http';
export const maxDuration=60;
export async function POST(request:Request){
 if(!sameOrigin(request))return errorResponse('Invalid request origin.',403);
 const user=await administrator();if(!user)return errorResponse('Administrator sign-in required.',401);
 try{
  const body=await readBody(request),db=database();
  if(body.action==='save'){
   const parsed=newsletterDraftSchema.safeParse(body.draft);if(!parsed.success)return errorResponse(parsed.error.issues[0].message);
   const {id,...draft}=parsed.data;
   const result=id?await db.from('newsletter_campaigns').update(draft).eq('id',id).eq('status','draft').select('id').single():await db.from('newsletter_campaigns').insert({...draft,created_by:user.id}).select('id').single();
   if(result.error)return errorResponse('The draft could not be saved. Queued newsletters cannot be edited.',409);
   await db.from('audit_log').insert({actor:user.id,action:'newsletter_draft_saved',record_id:result.data.id});
   return NextResponse.json({id:result.data.id},{headers:{'Cache-Control':'no-store'}});
  }
  if(body.action==='queue'){
   if(!newsletterSendingReady())return errorResponse('Connect the email provider and an approved public mailing address before queuing newsletters.',503);
   const id=z.string().uuid().safeParse(body.id);if(!id.success)return errorResponse('Save a valid draft before queuing it.');
   const {data,error}=await db.rpc('queue_newsletter',{p_campaign:id.data,p_actor:user.id});
   if(error)return errorResponse('This newsletter could not be queued. Check database setup and the 1,000-recipient limit.',409);
   if(data===0)return errorResponse('There are no confirmed subscribers yet. Nothing was queued.');
   // Queuing prepares the reviewed audience. Sending is a separate, explicit action.
   return NextResponse.json({recipients:data},{headers:{'Cache-Control':'no-store'}});
  }
  if(body.action==='send'){
   if(!newsletterSendingReady())return errorResponse('Email delivery and an approved public mailing address are required.',503);
   return NextResponse.json(await deliverNewsletters('campaign'),{headers:{'Cache-Control':'no-store'}});
  }
  if(body.action==='confirmations'){
   if(!newsletterSignupReady())return errorResponse('Connect email delivery before processing confirmation messages.',503);
   after(async()=>{try{await deliverNewsletters('confirmation');}catch{}});
   return NextResponse.json({message:'Confirmation-email processing requested. Refresh the queue to check provider acceptance.'},{headers:{'Cache-Control':'no-store'}});
  }
  return errorResponse('Unknown newsletter action.');
 }catch{return errorResponse('Newsletter setup or delivery is unavailable. Saved messages remain available to review.',503);}
}
