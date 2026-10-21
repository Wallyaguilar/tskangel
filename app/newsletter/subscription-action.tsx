'use client';
import Link from 'next/link';
import { useState } from 'react';
export default function SubscriptionAction({token,action}:{token:string;action:'confirm'|'unsubscribe'}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function submit(){setBusy(true);setError('');try{const r=await fetch('/api/newsletter/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const data=await r.json();if(!r.ok)setError(data.error);else setMessage(data.message);}catch{setError('We could not confirm this change. Please try again.');}finally{setBusy(false);}}
 return <>{message?<section className="success-notice" role="status"><h2>{action==='confirm'?'Welcome to the community.':'You’re unsubscribed.'}</h2><p>{message}</p><Link className="text-link" href="/">Return to TskAngel →</Link></section>:<><p>{action==='confirm'?'Confirm that you want TskAngel newsletters and outreach updates by email.':'This stops optional newsletters. Your volunteer commitments and essential event notices will remain unchanged.'}</p><button className="button yellow" disabled={busy} onClick={submit}>{busy?'Saving…':action==='confirm'?'Confirm my newsletter subscription':'Unsubscribe from newsletters'}</button></>}{error&&<p role="alert" className="form-error">{error}</p>}</>;
}
