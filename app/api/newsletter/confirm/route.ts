import { NextResponse } from 'next/server';
import { database,databaseReady } from '@/lib/data';
import { newsletterTokenSchema } from '@/lib/newsletter';
import { errorResponse,sameOrigin,readBody,rateLimit } from '@/lib/http';
export async function POST(request:Request){
 if(!sameOrigin(request))return errorResponse('Please confirm from this website.',403);
 if(!databaseReady())return errorResponse('Subscription management is temporarily unavailable.',503);
 try{const body=await readBody(request),token=newsletterTokenSchema.safeParse(body.token);if(!token.success)return errorResponse('This confirmation link is invalid.');if(!await rateLimit(request,'newsletter_confirm',15))return errorResponse('Please try again later.',429);const {data,error}=await database().rpc('confirm_newsletter',{p_token:token.data});if(error)return errorResponse('We could not confirm your subscription. Please try again.',503);if(data!=='confirmed')return errorResponse('This link has expired or is no longer valid. Please sign up again for a new confirmation link.');return NextResponse.json({message:'You’re subscribed! We look forward to sharing TskAngel news and outreach opportunities. You can unsubscribe using the link in any newsletter.'},{headers:{'Cache-Control':'no-store'}});}catch{return errorResponse('We could not confirm this link.');}
}
