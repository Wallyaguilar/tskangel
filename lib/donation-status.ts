export type DonationState = 'confirmed' | 'pending' | 'failed' | 'canceled' | 'refunded' | 'unavailable';
export type DonationResult = {state:DonationState; amountCents?:number; currency?:string};
export type VerifiedCheckout = {
  livemode:boolean; organization?:string; mode:string|null; paymentStatus:string;
  status:string|null; amountTotal:number|null; currency:string|null;
};
export type RecordedDonation = {status:string;amount_cents:number;currency:string;livemode:boolean};

// A successful browser redirect or Stripe 'paid' response alone is never enough.
// Success also needs the matching record written by our verified-webhook handler.
export function donationResult(session:VerifiedCheckout,record:RecordedDonation|null,paymentFailed=false):DonationResult{
  if(session.livemode||session.organization!=='tskangel'||!['payment','subscription'].includes(session.mode||''))return {state:'unavailable'};
  if(record?.livemode)return {state:'unavailable'};
  if(record&&(['refunded','partially_refunded'].includes(record.status)))return {state:'refunded'};
  if(record?.status==='completed'&&session.paymentStatus==='paid'){
    if(record.amount_cents!==session.amountTotal||record.currency!==session.currency)return {state:'unavailable'};
    return {state:'confirmed',amountCents:record.amount_cents,currency:record.currency};
  }
  // Never let an older failure message override a currently paid session.
  if(session.paymentStatus!=='paid'&&(record?.status==='failed'||paymentFailed))return {state:'failed'};
  if(session.status==='expired'&&session.paymentStatus!=='paid')return {state:'canceled'};
  return {state:'pending'};
}
export const donationMessages = {
  confirmed:{icon:'✓',title:'Test donation confirmed',message:'Thank you! Your test gift was verified and recorded. No real money was charged.'},
  pending:{icon:'…',title:'Confirming your test donation',message:'We’re waiting for payment confirmation. Please don’t submit another gift while we check. No real money is charged in test mode.'},
  failed:{icon:'!',title:'Test payment unsuccessful',message:'The payment did not complete successfully. No completed gift is confirmed. You can review your details and try the test checkout again.'},
  canceled:{icon:'–',title:'Checkout not completed',message:'This checkout was canceled or expired. No completed gift is confirmed for this checkout.'},
  refunded:{icon:'↩',title:'Test donation refunded or adjusted',message:'This test payment has a full or partial refund recorded. No real money was involved.'},
  unavailable:{icon:'?',title:'Payment status could not be checked',message:'We can’t confirm the result right now. Please don’t submit another gift until you’ve checked the original payment’s status.'},
} satisfies Record<DonationState,{icon:string;title:string;message:string}>;
