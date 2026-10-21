import { NextResponse } from 'next/server';
import { paymentsReady, stripe } from '@/lib/payments';
import { donationSchema } from '@/lib/validation';
import { errorResponse, rateLimit, readBody, sameOrigin } from '@/lib/http';
export async function POST(request:Request){
  if(!sameOrigin(request))return errorResponse('Please submit from this website.',403);
  if(!paymentsReady())return errorResponse('Test checkout is not connected yet. No payment has been collected.',503);
  try{
    const parsed=donationSchema.safeParse(await readBody(request));if(!parsed.success)return errorResponse(parsed.error.issues[0].message);
    if(!await rateLimit(request,'checkout',15))return errorResponse('Too many attempts. Please try again later.',429);
    const v=parsed.data;const base=process.env.SITE_URL!.replace(/\/$/,'');
    const metadata={organization:'tskangel',frequency:v.frequency,donor_name:v.name,message:v.message};
    const session=await stripe().checkout.sessions.create({
      mode:v.frequency==='monthly'?'subscription':'payment',allowed_payment_method_types:['card'],customer_email:v.email,
      line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:Math.round(v.amount*100),product_data:{name:v.frequency==='monthly'?'TskAngel monthly support — TEST':'TskAngel one-time support — TEST'},...(v.frequency==='monthly'?{recurring:{interval:'month' as const}}:{})}}],
      metadata,...(v.frequency==='monthly'?{subscription_data:{metadata}}:{payment_intent_data:{metadata,receipt_email:v.email}}),
      success_url:base+'/give?checkout=returned&session_id={CHECKOUT_SESSION_ID}',cancel_url:base+'/give?checkout=canceled',
    });
    if(session.livemode||!session.url)return errorResponse('Only test-mode checkout is allowed.',503);
    return NextResponse.json({url:session.url},{headers:{'Cache-Control':'no-store'}});
  }catch{return errorResponse('Test checkout could not start. No payment has been collected. Please try again later.',503);}
}
