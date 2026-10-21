import { after,NextResponse } from 'next/server';
import { administrator } from '@/lib/auth';
import { database } from '@/lib/data';
import { eventSchema } from '@/lib/validation';
import { errorResponse,readBody,sameOrigin } from '@/lib/http';
import { sendQueuedEmails } from '@/lib/email';
export async function POST(request:Request){
 if(!sameOrigin(request))return errorResponse('Invalid request origin.',403);const user=await administrator();if(!user)return errorResponse('Administrator sign-in required.',401);
 try{
  const parsed=eventSchema.safeParse(await readBody(request));if(!parsed.success)return errorResponse(parsed.error.issues[0].message);
  const e=parsed.data;const record={title:e.title,description:e.description,starts_at:e.startsAt,ends_at:e.endsAt,time_zone:e.timeZone,public_location:e.publicLocation,private_instructions:e.privateInstructions,capacity:e.capacity,registration_deadline:e.registrationDeadline,organizer_contact:e.organizerContact,status:e.status,published:e.published,registration_open:e.registrationOpen};
  const db=database();const result=e.id?await db.from('outreach_events').update(record).eq('id',e.id).select('id').single():await db.from('outreach_events').insert(record).select('id').single();
  if(result.error)return errorResponse('The event could not be saved. Check that capacity covers existing registrations.',409);
  await db.from('audit_log').insert({actor:user.id,action:e.id?'event_edited':'event_created',record_id:result.data.id});
  after(async()=>{try{await sendQueuedEmails();}catch{}});return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return errorResponse('The event could not be saved. Please try again.',503);}
}
