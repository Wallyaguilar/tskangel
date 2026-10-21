import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { database } from './data';

export function errorResponse(message:string,status=400){return NextResponse.json({error:message},{status});}
export function sameOrigin(request:Request){
  const origin=request.headers.get('origin');if(!origin)return false;
  try{
    const source=new URL(origin),internal=new URL(request.url);
    // Next.js can normalize request.url to localhost behind a reverse proxy.
    // Compare against the actual request Host while preserving HTTPS checks.
    const host=request.headers.get('host')||internal.host;
    const protocol=(request.headers.get('x-forwarded-proto')||internal.protocol.replace(':',''))+':';
    return ['http:','https:'].includes(source.protocol)&&source.host===host&&source.protocol===protocol;
  }catch{return false;}
}
export async function readBody(request:Request){
  if(Number(request.headers.get('content-length')||0)>24000)throw new Error('BODY_TOO_LARGE');
  const reader=request.body?.getReader();if(!reader)throw new Error('INVALID_JSON');
  let length=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>24000){await reader.cancel();throw new Error('BODY_TOO_LARGE');}chunks.push(value);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function rateLimit(request:Request,scope:string,limit:number,seconds=3600){
  const ip=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-real-ip')||'local';
  const key=createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY||'not-configured').update(scope+':'+ip).digest('hex');
  const {data,error}=await database().rpc('take_rate_limit',{p_key:key,p_limit:limit,p_seconds:seconds});
  if(error)throw new Error('RATE_LIMIT_UNAVAILABLE');return data===true;
}
