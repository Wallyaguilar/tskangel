import { z } from 'zod';
import { after,NextResponse } from 'next/server';
import { administrator } from '@/lib/auth';
import { database } from '@/lib/data';
import { errorResponse,readBody,sameOrigin } from '@/lib/http';
import { sendQueuedEmails } from '@/lib/email';
export async function POST(request:Request){if(!sameOrigin(request))return errorResponse('Invalid request origin.',403);const user=await administrator();if(!user)return errorResponse('Administrator sign-in required.',401);try{const p=z.object({id:z.string().uuid(),status:z.enum(['approved','declined'])}).strict().safeParse(await readBody(request));if(!p.success)return errorResponse('Invalid registration update.');const db=database();const {data,error}=await db.from('event_registrations').update({status:p.data.status}).eq('id',p.data.id).eq('status','pending').select('id');if(error||!data?.length)return errorResponse('Only pending registrations can be reviewed.',409);await db.from('audit_log').insert({actor:user.id,action:'registration_reviewed',record_id:p.data.id,changes:{status:p.data.status}});after(async()=>{try{await sendQueuedEmails();}catch{}});return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch{return errorResponse('Registration could not be updated.',503);}}
