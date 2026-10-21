import { after, NextResponse } from 'next/server';
import { database, databaseReady } from '@/lib/data';
import { registrationSchema } from '@/lib/validation';
import { errorResponse, rateLimit, readBody, sameOrigin } from '@/lib/http';
import { sendQueuedEmails } from '@/lib/email';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(request))return errorResponse('Please submit from this website.',403);
  if(!databaseReady())return errorResponse('Event registration is not connected yet.',503);
  const {id}=await params;if(!/^[\da-f-]{36}$/i.test(id))return errorResponse('Event not found.',404);
  try{
    const parsed=registrationSchema.safeParse(await readBody(request));if(!parsed.success)return errorResponse('Please check your contact information and acknowledgment.');
    if(!await rateLimit(request,'registration',10))return errorResponse('Too many attempts. Please try again later.',429);
    const v=parsed.data;const {data,error}=await database().rpc('register_for_event',{p_event:id,p_name:v.fullName,p_email:v.email,p_availability:v.availability});
    if(error)return errorResponse('Registration could not be saved. Please try again later.',503);
    if(data==='full')return errorResponse('This event is full. Please check for another opportunity.',409);
    if(data!=='received')return errorResponse('Registration for this event is closed.',409);
    after(async()=>{try{await sendQueuedEmails();}catch{}});
    return NextResponse.json({message:'Registration received and pending administrator approval. Confirmation is queued for email delivery. Check the calendar before attending; dates and locations may change.'},{headers:{'Cache-Control':'no-store'}});
  }catch{return errorResponse('Please check your information and try again.');}
}
