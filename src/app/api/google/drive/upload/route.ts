import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'node:stream';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { decryptSecret } from '@/lib/crypto';

async function findOrCreateFolder(drive:ReturnType<typeof google.drive>,name:string,parentId:string){
  const safe=name.replace(/'/g,"\\'");
  const found=await drive.files.list({q:`name='${safe}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,fields:'files(id,name)',pageSize:1});
  if(found.data.files?.[0]?.id) return found.data.files[0].id;
  const created=await drive.files.create({requestBody:{name,mimeType:'application/vnd.google-apps.folder',parents:[parentId]},fields:'id'}); if(!created.data.id) throw new Error('Falha ao criar pasta'); return created.data.id;
}

export async function POST(req:Request){
  try{
    const supabase=getSupabaseAdmin(); if(!supabase) return NextResponse.json({error:'Supabase não configurado'},{status:503});
    const form=await req.formData(); const file=form.get('file'); if(!(file instanceof File)) return NextResponse.json({error:'Arquivo obrigatório'},{status:400});
    const client=String(form.get('client')||'Sem cliente'); const campaign=String(form.get('campaign')||'Geral'); const creator=String(form.get('creator')||'Geral'); const category=String(form.get('category')||'Arquivos');
    const {data:integration}=await supabase.from('integrations').select('*').eq('provider','google_workspace').eq('status','connected').limit(1).single();
    if(!integration?.refresh_token_encrypted) return NextResponse.json({error:'Google Drive não conectado'},{status:409});
    const oauth2=new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_REDIRECT_URI); oauth2.setCredentials({refresh_token:decryptSecret(integration.refresh_token_encrypted)});
    const drive=google.drive({version:'v3',auth:oauth2}); const root=integration.metadata?.root_folder_id||process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID; if(!root) return NextResponse.json({error:'Pasta raiz não configurada'},{status:409});
    const clientFolder=await findOrCreateFolder(drive,client,root); const campaignFolder=await findOrCreateFolder(drive,campaign,clientFolder); const creatorFolder=await findOrCreateFolder(drive,creator,campaignFolder); const categoryFolder=await findOrCreateFolder(drive,category,creatorFolder);
    const buffer=Buffer.from(await file.arrayBuffer()); const uploaded=await drive.files.create({requestBody:{name:file.name,parents:[categoryFolder]},media:{mimeType:file.type||'application/octet-stream',body:Readable.from(buffer)},fields:'id,name,webViewLink,mimeType'});
    await supabase.from('files').insert({organization_id:integration.organization_id,name:uploaded.data.name||file.name,category,provider:'google_drive',external_id:uploaded.data.id,external_url:uploaded.data.webViewLink,mime_type:uploaded.data.mimeType});
    return NextResponse.json({ok:true,file:uploaded.data});
  }catch(error){console.error('drive_upload_error',error);return NextResponse.json({error:'Falha no upload para o Drive'},{status:500})}
}
