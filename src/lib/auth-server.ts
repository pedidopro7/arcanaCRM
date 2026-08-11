import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from './supabase-admin';

export async function getArcanaServerAuth(req:NextRequest){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const admin=getSupabaseAdmin();
  if(!url||!key||!admin) return null;
  const client=createServerClient(url,key,{
    cookies:{
      getAll(){return req.cookies.getAll()},
      setAll(){/* Route only reads the current browser session. */}
    }
  });
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user) return null;
  const {data:member}=await admin.from('organization_members').select('organization_id,role').eq('user_id',user.id).limit(1).maybeSingle();
  if(!member) return null;
  return {user,member,admin};
}
