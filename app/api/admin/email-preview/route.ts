import { NextResponse } from 'next/server';
import { administrator } from '@/lib/auth';
import { database } from '@/lib/data';
import { emailReady,sendQueuedEmails } from '@/lib/email';
import { errorResponse,rateLimit,sameOrigin } from '@/lib/http';
export const maxDuration=30;
export async function POST(request:Request){
 if(!sameOrigin(request))return errorResponse('Please request a sample from this website.',403);
 const user=await administrator();if(!user?.email)return errorResponse('Administrator sign-in required.',401);
 if(!emailReady())return errorResponse('Connect the email provider and sender before requesting a sample.',503);
 try{
  if(!await rateLimit(request,'email_design_preview',5,900))return errorResponse('Please wait before requesting another sample.',429);
  const {data,error}=await database().from('email_outbox').insert({kind:'email_design_preview',to_email:user.email,payload:{name:'Sample Volunteer'}}).select('id').single();
  if(error)return errorResponse('The sample could not be queued.',503);
  const result=await sendQueuedEmails(data.id);
  if(result.sent!==1)return errorResponse('The provider has not confirmed this sample send. Check its logs; the test sender can send only to its approved recipient.',503);
  return NextResponse.json({message:'The email provider accepted a design-preview message for your administrator address. Check your inbox and spam folder. This does not change any application.'},{headers:{'Cache-Control':'no-store'}});
 }catch{return errorResponse('We could not confirm the test send. Check the delivery queue and provider logs before retrying.',503);}
}
