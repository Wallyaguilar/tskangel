import { z } from 'zod';
export const newsletterConsent='I want to receive TskAngel newsletters, outreach updates, and opportunities to get involved by email. I can unsubscribe at any time.';
export const newsletterConsentVersion='2026-10-21';
export const newsletterSignupSchema=z.object({name:z.string().trim().max(100).default(''),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),consent:z.literal(true),website:z.string().max(0).default('')}).strict();
export const newsletterDraftSchema=z.object({id:z.string().uuid().optional(),subject:z.string().trim().min(3).max(160).refine(v=>!/[\r\n]/.test(v),'Use one line for the subject.'),body:z.string().trim().min(20).max(12000)}).strict();
export const newsletterTokenSchema=z.string().regex(/^[a-f0-9]{64}$/);
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function newsletterContent({subject,body,base,token,address}:{subject:string;body:string;base:string;token:string;address:string}){
 const unsubscribe=`${base}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
 const oneClick=`${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
 return {subject,text:`${subject}\n\n${body}\n\nTskAngel\n${address}\nYou’re receiving this because you confirmed your newsletter subscription.\nUnsubscribe: ${unsubscribe}\nUnsubscribing does not cancel volunteer registrations or essential event notices.`,
 html:`<!doctype html><html lang="en"><body style="margin:0;background:#FAFAF7;color:#475569;font-family:Arial,sans-serif"><main style="max-width:600px;margin:24px auto;background:white"><header style="padding:28px;background:#0F4C81;color:white"><strong style="font-size:26px">TskAngel</strong><p>Faith in Action. Love in Motion.</p></header><section style="padding:28px"><h1 style="color:#0F4C81;font-size:28px">${escape(subject)}</h1><p style="font-size:16px;line-height:1.8;white-space:pre-wrap">${escape(body)}</p></section><footer style="padding:24px;border-top:4px solid #FFD23F;font-size:12px;line-height:1.8"><p>TskAngel<br>${escape(address)}</p><p>You’re receiving this because you confirmed your newsletter subscription.</p><a style="color:#0F4C81" href="${escape(unsubscribe)}">Unsubscribe from newsletters</a><p>Unsubscribing does not cancel volunteer registrations or essential event notices.</p></footer></main></body></html>`,
 headers:{'List-Unsubscribe':`<${oneClick}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'},
 };
}
