import {z} from 'zod';
// A single monitored mailbox; never accept raw header lines or a recipient list.
export function emailReplyTo(value=process.env.EMAIL_REPLY_TO){if(!value)return undefined;return z.email().parse(value.trim());}
export function replyToConfigured(){try{return Boolean(emailReplyTo());}catch{return false;}}
