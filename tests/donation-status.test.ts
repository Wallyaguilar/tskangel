import test from 'node:test';
import assert from 'node:assert/strict';
import { donationResult,donationMessages,type VerifiedCheckout,type RecordedDonation } from '../lib/donation-status';
const paid:VerifiedCheckout={livemode:false,organization:'tskangel',mode:'payment',paymentStatus:'paid',status:'complete',amountTotal:1000,currency:'usd'};
const completed:RecordedDonation={status:'completed',amount_cents:1000,currency:'usd',livemode:false};
test('payment success needs both Stripe paid state and matching webhook-written record',()=>{
 assert.deepEqual(donationResult(paid,null),{state:'pending'});
 assert.deepEqual(donationResult(paid,completed),{state:'confirmed',amountCents:1000,currency:'usd'});
 assert.deepEqual(donationResult({...paid,paymentStatus:'unpaid'},completed),{state:'pending'});
});
test('monthly first-invoice confirmation uses the same verified-record requirement',()=>{
 assert.equal(donationResult({...paid,mode:'subscription'},null).state,'pending');
 assert.equal(donationResult({...paid,mode:'subscription'},completed).state,'confirmed');
});
test('live mode, a different organization, and unsupported checkout modes never show success',()=>{
 for(const session of [{...paid,livemode:true},{...paid,organization:'other'},{...paid,mode:'setup'},{...paid,organization:undefined}])assert.equal(donationResult(session,completed).state,'unavailable');
 assert.equal(donationResult(paid,{...completed,livemode:true}).state,'unavailable');
});
test('mismatched recorded amount or currency cannot confirm a gift',()=>{
 assert.equal(donationResult(paid,{...completed,amount_cents:2500}).state,'unavailable');
 assert.equal(donationResult(paid,{...completed,currency:'eur'}).state,'unavailable');
});
test('a confirmed failure is red-worthy; an unpaid or delayed session alone is not a failure',()=>{
 assert.equal(donationResult({...paid,paymentStatus:'unpaid'},null,true).state,'failed');
 assert.equal(donationResult({...paid,paymentStatus:'unpaid'},{...completed,status:'failed'}).state,'failed');
 assert.equal(donationResult({...paid,paymentStatus:'unpaid'},null).state,'pending');
});
test('a late failed event cannot override a paid session',()=>{
 assert.equal(donationResult(paid,{...completed,status:'failed'},true).state,'pending');
 assert.equal(donationResult(paid,completed,true).state,'confirmed');
});
test('full or partial refunds do not appear as a new successful gift',()=>{
 for(const status of ['refunded','partially_refunded'])assert.equal(donationResult(paid,{...completed,status}).state,'refunded');
});
test('expiration stays distinct from failure and successful payment',()=>{
 assert.equal(donationResult({...paid,status:'expired',paymentStatus:'unpaid'},null).state,'canceled');
 assert.equal(donationResult({...paid,status:'expired'},null).state,'pending');
});
test('every donor result has a readable label and explanation independent of color',()=>{
 for(const text of Object.values(donationMessages)){assert.ok(text.title.length>5);assert.ok(text.message.length>20);assert.ok(text.icon);}
 assert.match(donationMessages.confirmed.title,/Test donation confirmed/);
 assert.match(donationMessages.pending.message,/don’t submit another gift/);
});
