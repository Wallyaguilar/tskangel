'use client';
import { useEffect,useRef,useState } from 'react';
import { donationMessages,type DonationResult,type DonationState } from '@/lib/donation-status';
const states:DonationState[]=['confirmed','pending','failed','canceled','refunded','unavailable'];
export default function CheckoutResult({sessionId,canceled=false}:{sessionId?:string;canceled?:boolean}){
  const [result,setResult]=useState<DonationResult>({state:canceled?'canceled':sessionId?'pending':'unavailable'});
  const [busy,setBusy]=useState(false),[timedOut,setTimedOut]=useState(false);
  const [attempt,setAttempt]=useState(0);const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[]);
  useEffect(()=>{
    if(canceled||!sessionId)return;
    let stopped=false;let timer:ReturnType<typeof setTimeout>|undefined;let controller:AbortController|undefined;let checks=0;
    setTimedOut(false);
    async function check(){
      controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),10000);setBusy(true);
      try{
        const response=await fetch('/api/checkout/status?'+new URLSearchParams({session_id:sessionId!}),{cache:'no-store',signal:controller.signal});
        const data=await response.json();if(stopped)return;
        if(!response.ok||!states.includes(data.state)){setResult({state:'unavailable'});return;}
        setResult({state:data.state,...(data.state==='confirmed'?{amountCents:data.amountCents,currency:data.currency}:{})});
        if(data.state==='pending'){
          checks++;if(checks<12)timer=setTimeout(check,3000);else setTimedOut(true);
        }
      }catch{if(!stopped)setResult({state:'unavailable'});}finally{clearTimeout(timeout);if(!stopped)setBusy(false);}
    }
    void check();return()=>{stopped=true;clearTimeout(timer);controller?.abort();};
  },[sessionId,canceled,attempt]);
  const text=donationMessages[result.state];const tone=result.state==='confirmed'?'confirmed':result.state==='failed'?'failed':'pending';
  return <section className={`payment-result payment-${tone}`} aria-label="Test donation result">
    <span className="payment-symbol" aria-hidden="true">{text.icon}</span><div className="payment-content"><p className="payment-mode">TEST MODE · NO REAL MONEY</p><div role="status" aria-live="polite" aria-atomic="true"><h2 ref={heading} tabIndex={-1}>{text.title}</h2><p>{text.message}</p>{result.state==='confirmed'&&result.amountCents!==undefined&&<p className="payment-amount">{new Intl.NumberFormat('en-US',{style:'currency',currency:result.currency||'USD'}).format(result.amountCents/100)} test gift</p>}{timedOut&&result.state==='pending'&&<p>Confirmation is taking longer than expected. This does not mean the payment failed. You can check again below.</p>}</div>
    {!canceled&&sessionId&&['pending','unavailable'].includes(result.state)&&<button type="button" className="outline-button" disabled={busy} onClick={()=>setAttempt(n=>n+1)}>{busy?'Checking payment status…':'Check payment status again'}</button>}
    {!sessionId&&!canceled&&<p className="small">This older return link has no checkout reference. An administrator can check the original test gift under Test donation activity.</p>}
    </div></section>;
}
