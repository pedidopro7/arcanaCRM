import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const createSchema=z.object({email:z.string().email(),password:z.string().min(8),name:z.string().min(2).max(120),role:z.enum(['admin','manager','operator','finance','viewer']).default('operator')});

async function authorize(req:Request){
  const admin=getSupabaseAdmin();
  if(!admin) return {error:NextResponse.json({error:'Supabase não configurado.'},{status:503})};
  const header=req.headers.get('authorization')||'';const token=header.startsWith('Bearer ')?header.slice(7):'';
  if(!token) return {error:NextResponse.json({error:'Não autenticado.'},{status:401})};
  const {data:{user},error:userError}=await admin.auth.getUser(token);
  if(userError||!user) return {error:NextResponse.json({error:'Sessão inválida.'},{status:401})};
  const {data:member,error:memberError}=await admin.from('organization_members').select('organization_id,role').eq('user_id',user.id).limit(1).maybeSingle();
  if(memberError||!member) return {error:NextResponse.json({error:'Usuário sem workspace.'},{status:403})};
  if(!['admin','manager'].includes(member.role)) return {error:NextResponse.json({error:'Sem permissão para gerenciar usuários.'},{status:403})};
  return {admin,member};
}

export async function GET(req:Request){
  const auth=await authorize(req);if('error' in auth)return auth.error;const {admin,member}=auth;
  const {data:list,error:listError}=await admin.auth.admin.listUsers({page:1,perPage:200});
  if(listError)return NextResponse.json({error:listError.message},{status:500});
  const ids=list.users.map(u=>u.id);const {data:members}=ids.length?await admin.from('organization_members').select('user_id,role').eq('organization_id',member.organization_id).in('user_id',ids):{data:[] as {user_id:string;role:string}[]};
  const roleMap=new Map((members||[]).map(m=>[m.user_id,m.role]));
  const users=list.users.filter(u=>roleMap.has(u.id)).map(u=>({id:u.id,email:u.email,name:u.user_metadata?.name||u.user_metadata?.full_name||u.email?.split('@')[0]||'Usuário',role:roleMap.get(u.id)||'operator',created_at:u.created_at,last_sign_in_at:u.last_sign_in_at}));
  return NextResponse.json({users});
}

export async function POST(req:Request){
  const auth=await authorize(req);if('error' in auth)return auth.error;const {admin,member}=auth;
  const parsed=createSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Dados inválidos.',issues:parsed.error.flatten()},{status:400});
  const {email,password,name,role}=parsed.data;
  const {data,error}=await admin.auth.admin.createUser({email:email.toLowerCase().trim(),password,email_confirm:true,user_metadata:{name}});
  if(error||!data.user)return NextResponse.json({error:error?.message||'Não foi possível criar o usuário.'},{status:400});
  const {error:memberError}=await admin.from('organization_members').upsert({organization_id:member.organization_id,user_id:data.user.id,role},{onConflict:'organization_id,user_id'});
  if(memberError)return NextResponse.json({error:memberError.message},{status:500});
  return NextResponse.json({ok:true,user:{id:data.user.id,email:data.user.email,name,role}},{status:201});
}
