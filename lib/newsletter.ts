import { renderMinistryEmail } from './email-design';
import { z } from 'zod';
export const newsletterConsent='I want to receive TskAngel newsletters, outreach updates, and opportunities to get involved by email. I can unsubscribe at any time.';
export const newsletterConsentVersion='2026-10-21';
export const newsletterSignupSchema=z.object({name:z.string().trim().max(100).default(''),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),consent:z.literal(true),website:z.string().max(0).default('')}).strict();
export const newsletterDraftSchema=z.object({id:z.string().uuid().optional(),subject:z.string().trim().min(3).max(160).refine(v=>!/[\r\n]/.test(v),'Use one line for the subject.'),body:z.string().trim().min(20).max(12000)}).strict();
export const newsletterTokenSchema=z.string().regex(/^[a-f0-9]{64}$/);
export function newsletterContent({subject,body,base,token,address}:{subject:string;body:string;base:string;token:string;address:string}){
 const unsubscribe=`${base}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
 const oneClick=`${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
 const content=renderMinistryEmail({subject,eyebrow:'NEWS FROM TSKANGEL',title:subject,paragraphs:[body],footer:`TskAngel\n${address}\nYou’re receiving this because you confirmed your newsletter subscription.\nUnsubscribing does not cancel volunteer registrations or essential event notices.`,footerLinks:[{label:'Unsubscribe from newsletters',url:unsubscribe}]});
 return {...content,
 headers:{'List-Unsubscribe':`<${oneClick}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'},
 };
}
