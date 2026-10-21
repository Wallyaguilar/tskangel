import { after,NextResponse } from 'next/server';
import { database } from '@/lib/data';
import { newsletterSignupSchema,newsletterConsent,newsletterConsentVersion } from '@/lib/newsletter';
import { newsletterSignupReady,deliverNewsletters } from '@/lib/newsletter-server';
import { errorResponse,sameOrigin,readBody,rateLimit } from '@/lib/http';
export const maxDuration=60;
export async function POST(request:Request){
 if(!sameOrigin(request))return errorResponse('Please sign up from this website.',403);
 if(!newsletterSignupReady())return errorResponse('Newsletter signup will open after our secure email service is connected.',503);
 try{
  const parsed=newsletterSignupSchema.safeParse(await readBody(request));if(!parsed.success)return errorResponse('Please enter a valid email and select the newsletter consent checkbox.');
  if(!await rateLimit(request,'newsletter_signup',5))return errorResponse('Too many requests. Please try again later.',429);
  const {error}=await database().rpc('request_newsletter',{p_email:parsed.data.email,p_name:parsed.data.name,p_consent:newsletterConsent,p_version:newsletterConsentVersion});
  if(error)return errorResponse('Your signup could not be saved. Please try again later.',503);
  after(async()=>{try{await deliverNewsletters('confirmation');}catch{}});
  return NextResponse.json({message:'If this address needs confirmation, a confirmation email is queued. Follow its link to finish subscribing. Already confirmed? You’re all set. Check spam if needed; you are not newly subscribed until you confirm.'},{headers:{'Cache-Control':'no-store'}});
 }catch{return errorResponse('We could not process your signup. Please check your information and try again.');}
}
