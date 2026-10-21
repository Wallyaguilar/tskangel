import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { database } from '@/lib/data';
import { paymentsReady, stripe } from '@/lib/payments';
export async function POST(request:Request){
  if(!paymentsReady())return new Response('Test payments not configured',{status:503});
  const signature=request.headers.get('stripe-signature');if(!signature)return new Response('Signature required',{status:400});
  let event:Stripe.Event;
  try{event=stripe().webhooks.constructEvent(await request.text(),signature,process.env.STRIPE_WEBHOOK_SECRET!);}catch{return new Response('Invalid signature',{status:400});}
  if(event.livemode)return new Response('Live payments are disabled',{status:400});
  let external='',amount=0,currency='usd',frequency='once',status='completed',customer:string|null=null,subscription:string|null=null;
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
    const session=event.data.object as Stripe.Checkout.Session;
    if(session.metadata?.organization!=='tskangel'||session.mode!=='payment'||session.payment_status!=='paid')return NextResponse.json({received:true});
    external=typeof session.payment_intent==='string'?session.payment_intent:session.id;amount=session.amount_total||0;currency=session.currency||'usd';customer=typeof session.customer==='string'?session.customer:null;
  }else if(event.type==='invoice.paid'||event.type==='invoice.payment_failed'){
    const invoice=event.data.object as Stripe.Invoice;
    const parent=invoice.parent?.subscription_details;const sub=parent?.subscription;
    if(!sub)return NextResponse.json({received:true});
    subscription=typeof sub==='string'?sub:sub.id;
    const record=await stripe().subscriptions.retrieve(subscription);
    if(record.metadata.organization!=='tskangel')return NextResponse.json({received:true});
    external=invoice.id;amount=event.type==='invoice.paid'?invoice.amount_paid:invoice.amount_due;currency=invoice.currency;frequency='monthly';status=event.type==='invoice.paid'?'completed':'failed';customer=typeof invoice.customer==='string'?invoice.customer:null;
  }else if(event.type==='charge.refunded'){
    const charge=event.data.object as Stripe.Charge;
    if(charge.metadata.organization!=='tskangel')return NextResponse.json({received:true});
    external=typeof charge.payment_intent==='string'?charge.payment_intent:charge.id;amount=charge.amount;currency=charge.currency;status=charge.refunded?'refunded':'partially_refunded';
  }else if(event.type==='customer.subscription.deleted'){
    const record=event.data.object as Stripe.Subscription;
    if(record.metadata.organization!=='tskangel')return NextResponse.json({received:true});
    external=record.id;subscription=record.id;frequency='monthly';status='canceled';customer=typeof record.customer==='string'?record.customer:null;
  }else return NextResponse.json({received:true});
  try{
    const {error}=await database().rpc('record_test_donation',{p_event:event.id,p_external:external,p_amount:amount,p_currency:currency,p_frequency:frequency,p_status:status,p_customer:customer,p_subscription:subscription});
    if(error)return new Response('Please retry',{status:500});return NextResponse.json({received:true});
  }catch{return new Response('Please retry',{status:500});}
}
