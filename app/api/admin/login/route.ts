import { NextResponse } from 'next/server';
import { z } from 'zod';
import { database,databaseReady } from '@/lib/data';
import { sessionCookie } from '@/lib/auth';
import { sameOrigin,errorResponse,readBody,rateLimit } from '@/lib/http';
export async function POST(request:Request){
 if(!sameOrigin(request))return errorResponse('Please sign in from this website.',403);
 if(!databaseReady())return errorResponse('Administrator authentication is not connected yet.',503);
 try{
  const parsed=z.object({email:z.string().email().max(254),password:z.string().min(8).max(200)}).strict().safeParse(await readBody(request));if(!parsed.success)return errorResponse('Check your email and password.');
  if(!await rateLimit(request,'admin_login',10,900))return errorResponse('Too many sign-in attempts. Please wait 15 minutes.',429);
  const db=database();const {data,error}=await db.auth.signInWithPassword(parsed.data);if(error||!data.user||!data.session)return errorResponse('Unable to sign in with these credentials.',401);
  const {data:role}=await database().from('administrators').select('user_id').eq('user_id',data.user.id).maybeSingle();if(!role)return errorResponse('Unable to sign in with these credentials.',401);
  const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(sessionCookie,data.session.access_token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:Math.min(data.session.expires_in,3600)});return response;
 }catch{return errorResponse('Sign-in is temporarily unavailable.',503);}
}
