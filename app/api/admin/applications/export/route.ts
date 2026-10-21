import { administrator } from '@/lib/auth';
import { database } from '@/lib/data';
import { errorResponse } from '@/lib/http';
export async function GET(){const user=await administrator();if(!user)return errorResponse('Administrator sign-in required.',401);const {data,error}=await database().from('volunteer_applications').select('*').order('created_at');if(error)return errorResponse('Export could not be generated.',503);await database().from('audit_log').insert({actor:user.id,action:'applications_exported'});return new Response(JSON.stringify(data,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="tskangel-volunteers.json"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
