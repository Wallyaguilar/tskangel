import { NextResponse } from 'next/server';
import { administrator } from '@/lib/auth';
import { sameOrigin,errorResponse } from '@/lib/http';
import { emailReady,sendQueuedEmails } from '@/lib/email';
export async function POST(request:Request){if(!sameOrigin(request))return errorResponse('Invalid request origin.',403);if(!await administrator())return errorResponse('Administrator sign-in required.',401);if(!emailReady())return errorResponse('Connect Resend, an approved sender, and SITE_URL before sending email.',503);try{return NextResponse.json(await sendQueuedEmails(),{headers:{'Cache-Control':'no-store'}});}catch{return errorResponse('Delivery could not be completed. Messages remain queued.',503);}}
