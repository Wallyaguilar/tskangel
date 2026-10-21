import test from 'node:test';
import assert from 'node:assert/strict';
import { sendQueuedEmails } from '../lib/email';
test('a requested email sample sends only its own queued row and includes HTML plus text',async()=>{
 const names=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','EMAIL_FROM','SITE_URL','EMAIL_REPLY_TO'];const previous=Object.fromEntries(names.map(n=>[n,process.env[n]]));
 // These are local-only invalid fixtures; the mock rejects every real destination.
 Object.assign(process.env,{SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'invalid-local-fixture',RESEND_API_KEY:'invalid-local-fixture',EMAIL_FROM:'Test Sender <sender@example.test>',EMAIL_REPLY_TO:'ministry@example.test',SITE_URL:'https://website.example.test'});
 const original=globalThis.fetch;let providerCalls=0,updates=0;
 globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url),method=init?.method||'GET';
  if(url.hostname==='database.example.test'){
   assert.equal(url.searchParams.get('id'),'eq.sample-row');
   if(method==='GET'){assert.equal(url.searchParams.get('status'),'eq.pending');assert.equal(url.searchParams.get('limit'),'1');return new Response(JSON.stringify([{id:'sample-row',kind:'email_design_preview',to_email:'admin@example.test',payload:{name:'Sample Volunteer'}}]),{headers:{'Content-Type':'application/json'}});}
   assert.equal(method,'PATCH');updates++;return new Response(null,{status:204});
  }
  assert.equal(url.href,'https://api.resend.com/emails');assert.equal(method,'POST');providerCalls++;
  const body=JSON.parse(String(init?.body));assert.deepEqual(body.to,['admin@example.test']);assert.equal(body.reply_to,'ministry@example.test');assert.match(body.subject,/Design preview/);assert.match(body.html,/#0F4C81/);assert.match(body.text,/SAMPLE CONTENT ONLY/);assert.equal(new Headers(init?.headers).get('Idempotency-Key'),'sample-row');
  return new Response(JSON.stringify({id:'provider-fixture'}),{headers:{'Content-Type':'application/json'}});
 };
 try{const result=await sendQueuedEmails('sample-row');assert.equal(result.sent,1);assert.equal(providerCalls,1);assert.equal(updates,2);}finally{globalThis.fetch=original;for(const name of names){if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}}
});
