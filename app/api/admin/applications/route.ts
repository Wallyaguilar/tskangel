import { z } from 'zod';
import { after,NextResponse } from 'next/server';
import { administrator } from '@/lib/auth';
import { database } from '@/lib/data';
import { errorResponse,readBody,sameOrigin } from '@/lib/http';
import { sendQueuedEmails } from '@/lib/email';
const schema=z.object({id:z.string().uuid(),status:z.enum(['pending','approved','declined']).optional(),notes:z.string().max(4000).optional(),action:z.enum(['update','delete']).default('update')}).strict();
export async function POST(request:Request){if(!sameOrigin(request))return errorResponse('Invalid request origin.',403);const user=await administrator();if(!user)return errorResponse('Administrator sign-in required.',401);try{const p=schema.safeParse(await readBody(request));if(!p.success)return errorResponse('Invalid application update.');const v=p.data;const db=database();const result=v.action==='delete'?await db.from('volunteer_applications').delete().eq('id',v.id).select('id'):await db.from('volunteer_applications').update({...(v.status?{status:v.status}:{}),...(v.notes!==undefined?{internal_notes:v.notes}:{})}).eq('id',v.id).select('id');if(result.error||!result.data?.length)return errorResponse('Application could not be updated.',409);await db.from('audit_log').insert({actor:user.id,action:'application_'+v.action,record_id:v.id,changes:v.status?{status:v.status}:null});after(async()=>{try{await sendQueuedEmails();}catch{}});return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch{return errorResponse('Update failed. Please try again.',503);}}
