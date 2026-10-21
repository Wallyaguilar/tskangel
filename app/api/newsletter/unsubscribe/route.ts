import { NextResponse } from 'next/server';
import { database,databaseReady } from '@/lib/data';
import { newsletterTokenSchema } from '@/lib/newsletter';
import { errorResponse,sameOrigin,readBody,rateLimit } from '@/lib/http';
export async function POST(request:Request){
 if(!databaseReady())return errorResponse('Subscription management is temporarily unavailable.',503);
 try{
  let rawToken:unknown;
  if(request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')){
   // RFC 8058 one-click requests come from mail providers, without browser Origin.
   if(Number(request.headers.get('content-length')||0)>1000)return errorResponse('Invalid unsubscribe request.');
   const reader=request.body?.getReader();let body='';if(reader)while(true){const {done,value}=await reader.read();if(done)break;body+=new TextDecoder().decode(value);if(body.length>1000){await reader.cancel();return errorResponse('Invalid unsubscribe request.');}}
   if(new URLSearchParams(body).get('List-Unsubscribe')!=='One-Click')return errorResponse('Invalid unsubscribe request.');
   rawToken=new URL(request.url).searchParams.get('token');
  }else{
   if(!sameOrigin(request))return errorResponse('Please unsubscribe from this website.',403);
   rawToken=(await readBody(request)).token;
  }
  const token=newsletterTokenSchema.safeParse(rawToken);if(!token.success)return errorResponse('This unsubscribe link is invalid.');
  if(!await rateLimit(request,'newsletter_unsubscribe',100))return errorResponse('Please try again later.',429);
  const {data,error}=await database().rpc('unsubscribe_newsletter',{p_token:token.data});
  if(error)return errorResponse('We could not confirm your unsubscribe request. Please try again.',503);
  if(!data)return errorResponse('This unsubscribe link is invalid. Use the link in your latest newsletter.');
  return NextResponse.json({message:'You’re unsubscribed from TskAngel newsletters. Your volunteer registrations and essential event notices are unchanged. A message already being sent may still arrive.'},{headers:{'Cache-Control':'no-store'}});
 }catch{return errorResponse('We could not process your unsubscribe request.');}
}
