import { NextResponse } from 'next/server';
import { database } from '@/lib/data';
import { paymentsReady,stripe } from '@/lib/payments';
import { rateLimit } from '@/lib/http';
import { donationResult } from '@/lib/donation-status';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  const respond=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
  const id=new URL(request.url).searchParams.get('session_id');
  if(!id||!/^cs_test_[a-zA-Z0-9_]{10,240}$/.test(id))return respond({state:'unavailable'},400);
  if(!paymentsReady())return respond({state:'unavailable'},503);
  try{
    if(!await rateLimit(request,'checkout_status',90,60))return respond({state:'unavailable'},429);
    const processor=stripe();const session=await processor.checkout.sessions.retrieve(id);
    if(session.livemode||session.metadata?.organization!=='tskangel'||!['payment','subscription'].includes(session.mode||''))return respond({state:'unavailable'});
    const external=session.mode==='subscription'
      ?typeof session.invoice==='string'?session.invoice:session.invoice?.id
      :typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id;
    let record=null;
    if(external){
      const result=await database().from('donations').select('status,amount_cents,currency,livemode').eq('external_id',external).maybeSingle();
      if(result.error)return respond({state:'unavailable'},503);
      record=result.data;
    }
    let failed=false;
    if(!record&&session.mode==='payment'&&session.payment_status!=='paid'&&session.payment_intent){
      const intent=typeof session.payment_intent==='string'?await processor.paymentIntents.retrieve(session.payment_intent):session.payment_intent;
      failed=intent.status==='canceled'||Boolean(intent.last_payment_error&&intent.status==='requires_payment_method');
    }
    // Never return names, email, messages, customer IDs, or subscription IDs.
    return respond(donationResult({livemode:session.livemode,organization:session.metadata?.organization,mode:session.mode,paymentStatus:session.payment_status,status:session.status,amountTotal:session.amount_total,currency:session.currency},record,failed));
  }catch{return respond({state:'unavailable'},503);}
}
