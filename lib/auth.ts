import { cookies } from 'next/headers';
import { database, databaseReady } from './data';
export const sessionCookie='tskangel_admin';
export async function administrator(){
  if(!databaseReady())return null;
  const token=(await cookies()).get(sessionCookie)?.value;if(!token)return null;
  const db=database();const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return null;
  const {data}=await db.from('administrators').select('user_id').eq('user_id',user.id).maybeSingle();return data?user:null;
}
