import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'node:stream';
import { decryptSecret } from '@/lib/crypto';
import { getArcanaServerAuth } from '@/lib/auth-server';

async function findOrCreateFolder(drive:ReturnType<typeof google.drive>,name:string,parentId:string){
  const clean=(name||'Geral').trim().slice(0,120)||'Geral';
  const safe=clean.replace(/'/g,"\\'");
  const found=await drive.files.list({q:`name='${safe}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,fields:'files(id,name)',pageSize:1});
  if(found.data.files?.[0]?.id)return found.data.files[0].id;
  const created=await drive.files.create({requestBody:{name:clean,mimeType:'application/vnd.google-apps.folder',parents:[parentId]},fields:'id'});
  if(!created.data.id)throw new Error('Falha ao criar pasta');
  return created.data.id;
}

export async function POST(req:NextRequest){
  try{
    const auth=await getArcanaServerAuth(req);
    if(!auth)return NextResponse.json({error:'Não autenticado.'},{status:401});
    const form=await req.formData();const file=form.get('file');
    if(!(file instanceof File))return NextResponse.json({error:'Arquivo obrigatório'},{status:400});
    if(file.size>50*1024*1024)return NextResponse.json({error:'Arquivo excede 50 MB'},{status:413});

    const client=String(form.get('client')||'Sem cliente');const campaign=String(form.get('campaign')||'Geral');const creator=String(form.get('creator')||'Geral');const category=String(form.get('category')||'Arquivos');
    let clientId=String(form.get('client_id')||'')||null;let campaignId=String(form.get('campaign_id')||'')||null;let influencerId=String(form.get('influencer_id')||'')||null;let contractId=String(form.get('contract_id')||'')||null;
    const orgId=auth.member.organization_id;

    if(clientId){const {data}=await auth.admin.from('clients').select('id').eq('id',clientId).eq('organization_id',orgId).maybeSingle();if(!data)clientId=null;}
    if(campaignId){const {data}=await auth.admin.from('campaigns').select('id').eq('id',campaignId).eq('organization_id',orgId).maybeSingle();if(!data)campaignId=null;}
    if(influencerId){const {data}=await auth.admin.from('influencers').select('id').eq('id',influencerId).eq('organization_id',orgId).maybeSingle();if(!data)influencerId=null;}
    if(contractId){const {data}=await auth.admin.from('contracts').select('id').eq('id',contractId).eq('organization_id',orgId).maybeSingle();if(!data)contractId=null;}

    const {data:integration,error:integrationError}=await auth.admin.from('integrations').select('*').eq('organization_id',orgId).eq('provider','google_workspace').eq('status','connected').maybeSingle();
    if(integrationError)throw integrationError;
    if(!integration?.refresh_token_encrypted)return NextResponse.json({error:'Google Drive não conectado'},{status:409});

    const clientIdEnv=process.env.GOOGLE_CLIENT_ID;const clientSecret=process.env.GOOGLE_CLIENT_SECRET;const redirectUri=process.env.GOOGLE_REDIRECT_URI;
    if(!clientIdEnv||!clientSecret||!redirectUri)return NextResponse.json({error:'Credenciais Google não configuradas.'},{status:503});
    const oauth2=new google.auth.OAuth2(clientIdEnv,clientSecret,redirectUri);oauth2.setCredentials({refresh_token:decryptSecret(integration.refresh_token_encrypted)});
    const drive=google.drive({version:'v3',auth:oauth2});const root=integration.metadata?.root_folder_id||process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if(!root)return NextResponse.json({error:'Pasta raiz não configurada'},{status:409});

    const clientFolder=await findOrCreateFolder(drive,client,root);const campaignFolder=await findOrCreateFolder(drive,campaign,clientFolder);const creatorFolder=await findOrCreateFolder(drive,creator,campaignFolder);const categoryFolder=await findOrCreateFolder(drive,category,creatorFolder);
    const buffer=Buffer.from(await file.arrayBuffer());const uploaded=await drive.files.create({requestBody:{name:file.name,parents:[categoryFolder]},media:{mimeType:file.type||'application/octet-stream',body:Readable.from(buffer)},fields:'id,name,webViewLink,mimeType'});
    const {error:fileError}=await auth.admin.from('files').insert({organization_id:orgId,client_id:clientId,campaign_id:campaignId,influencer_id:influencerId,contract_id:contractId,name:uploaded.data.name||file.name,category,provider:'google_drive',external_id:uploaded.data.id,external_url:uploaded.data.webViewLink,mime_type:uploaded.data.mimeType,created_by:auth.user.id});
    if(fileError)throw fileError;
    await auth.admin.from('activity_logs').insert({organization_id:orgId,actor_user_id:auth.user.id,client_id:clientId,campaign_id:campaignId,influencer_id:influencerId,event_type:'file_uploaded',description:`Arquivo enviado ao Drive: ${uploaded.data.name||file.name}`,metadata:{category,external_id:uploaded.data.id}});
    return NextResponse.json({ok:true,file:uploaded.data});
  }catch(error){console.error('drive_upload_error',error);return NextResponse.json({error:error instanceof Error?error.message:'Falha no upload para o Drive'},{status:500})}
}
