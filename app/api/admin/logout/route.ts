import { NextResponse } from 'next/server';
import { sessionCookie } from '@/lib/auth';
import { sameOrigin,errorResponse } from '@/lib/http';
export async function POST(request:Request){if(!sameOrigin(request))return errorResponse('Please submit from this website.',403);const response=NextResponse.redirect(new URL('/admin/login',request.url),303);response.cookies.set(sessionCookie,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});return response;}
