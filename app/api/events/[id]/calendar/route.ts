import { publicEvent } from '@/lib/data';
import { calendarFile } from '@/lib/calendar';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const event=await publicEvent(id);if(!event)return new Response('Event not found',{status:404});
  const base=process.env.SITE_URL||new URL(request.url).origin;
  return new Response(calendarFile(event,`${base.replace(/\/$/,'')}/calendar/${id}`),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="tskangel-${id}.ics"`,'Cache-Control':'no-store'}});
}
