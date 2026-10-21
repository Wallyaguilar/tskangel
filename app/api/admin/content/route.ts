import { NextResponse } from 'next/server';
import { administrator } from '@/lib/auth';
import { database } from '@/lib/data';
import { contentSchema } from '@/lib/validation';
import { errorResponse,readBody,sameOrigin } from '@/lib/http';
export async function POST(request:Request){if(!sameOrigin(request))return errorResponse('Invalid request origin.',403);const user=await administrator();if(!user)return errorResponse('Administrator sign-in required.',401);try{const p=contentSchema.safeParse(await readBody(request));if(!p.success)return errorResponse('Mission and vision must each be 20–2,000 characters.');const {error}=await database().from('site_content').upsert({id:1,...p.data});if(error)return errorResponse('Content could not be saved.',503);await database().from('audit_log').insert({actor:user.id,action:'mission_vision_updated',record_id:'1'});return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch{return errorResponse('Content could not be saved.',503);}}
