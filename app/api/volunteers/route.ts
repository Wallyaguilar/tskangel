import { after, NextResponse } from 'next/server';
import { database, databaseReady } from '@/lib/data';
import { volunteerSchema } from '@/lib/validation';
import { errorResponse, rateLimit, readBody, sameOrigin } from '@/lib/http';
import { sendQueuedEmails } from '@/lib/email';
export async function POST(request:Request){
  if(!sameOrigin(request))return errorResponse('Please submit from this website.',403);
  if(!databaseReady())return errorResponse('Volunteer applications are not open yet. The secure database must be connected first.',503);
  try{
    const parsed=volunteerSchema.safeParse(await readBody(request));if(!parsed.success)return errorResponse('Please check the required fields and acknowledgments.');
    if(!await rateLimit(request,'volunteer',5))return errorResponse('Too many attempts. Please try again later.',429);
    const v=parsed.data;const {website,...stored}=v;void website;
    const {error}=await database().from('volunteer_applications').insert({full_name:v.fullName,email:v.email,application_data:stored});
    if(error&&error.code!=='23505')return errorResponse('Your application could not be saved. Please try again later.',503);
    after(async()=>{try{await sendQueuedEmails();}catch{}});
    return NextResponse.json({message:'Thank You for Your Willingness to Serve! We received your application. Our team will review your information and contact you about upcoming opportunities. Email confirmation is queued for delivery; this is not approval or an event placement.'},{headers:{'Cache-Control':'no-store'}});
  }catch{return errorResponse('Your application could not be submitted. Please check your information and try again.',400);}
}
