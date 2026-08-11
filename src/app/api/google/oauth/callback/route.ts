import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { encryptSecret } from '@/lib/crypto';
import { getArcanaServerAuth } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try{
    const auth=await getArcanaServerAuth(req);
    if(!auth) return NextResponse.redirect(new URL('/?auth=required',req.url));
    const code=req.nextUrl.searchParams.get('code');
    const state=req.nextUrl.searchParams.get('state');
    const expected=req.cookies.get('google_oauth_state')?.value;
    const expectedOrg=req.cookies.get('google_oauth_org')?.value;
    if(!code||!state||state!==expected||!expectedOrg||expectedOrg!==auth.member.organization_id) return NextResponse.json({error:'OAuth inválido ou expirado.'},{status:400});
    const clientId=process.env.GOOGLE_CLIENT_ID;const clientSecret=process.env.GOOGLE_CLIENT_SECRET;const redirectUri=process.env.GOOGLE_REDIRECT_URI;
    if(!clientId||!clientSecret||!redirectUri) return NextResponse.json({error:'Credenciais Google não configuradas.'},{status:503});
    const oauth2=new google.auth.OAuth2(clientId,clientSecret,redirectUri);
    const {tokens}=await oauth2.getToken(code);
    if(!tokens.refresh_token) return NextResponse.json({error:'Google não retornou refresh token. Reconecte usando consentimento completo.'},{status:400});
    const {error}=await auth.admin.from('integrations').upsert({organization_id:auth.member.organization_id,provider:'google_workspace',status:'connected',refresh_token_encrypted:encryptSecret(tokens.refresh_token),metadata:{scope:tokens.scope,root_folder_id:process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID||null,connected_by:auth.user.id},updated_at:new Date().toISOString()},{onConflict:'organization_id,provider'});
    if(error) return NextResponse.json({error:error.message},{status:500});
    const response=NextResponse.redirect(new URL('/configuracoes/integracoes?google=connected',req.url));
    response.cookies.delete('google_oauth_state');response.cookies.delete('google_oauth_org');
    return response;
  }catch(error){
    console.error('google_oauth_callback_error',error);
    return NextResponse.json({error:'Falha ao concluir a conexão com o Google.'},{status:500});
  }
}
