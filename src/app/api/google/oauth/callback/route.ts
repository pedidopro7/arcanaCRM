import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { encryptSecret } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const code=req.nextUrl.searchParams.get('code'); const state=req.nextUrl.searchParams.get('state'); const expected=req.cookies.get('google_oauth_state')?.value;
  if(!code||!state||state!==expected) return NextResponse.json({error:'OAuth inválido ou expirado.'},{status:400});
  const oauth2=new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_REDIRECT_URI);
  const {tokens}=await oauth2.getToken(code); if(!tokens.refresh_token) return NextResponse.json({error:'Google não retornou refresh token.'},{status:400});
  const supabase=getSupabaseAdmin(); if(!supabase) return NextResponse.json({error:'Supabase ainda não configurado.'},{status:503});
  const {data:org}=await supabase.from('organizations').select('id').limit(1).single();
  if(!org) return NextResponse.json({error:'Organização não encontrada.'},{status:400});
  await supabase.from('integrations').upsert({organization_id:org.id,provider:'google_workspace',status:'connected',refresh_token_encrypted:encryptSecret(tokens.refresh_token),metadata:{scope:tokens.scope,root_folder_id:process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID||null},updated_at:new Date().toISOString()},{onConflict:'organization_id,provider'});
  const response=NextResponse.redirect(new URL('/configuracoes/integracoes?google=connected',req.url)); response.cookies.delete('google_oauth_state'); return response;
}
