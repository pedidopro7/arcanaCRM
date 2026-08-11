'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Cloud, Link2, ShieldCheck, CheckCircle2, RefreshCw, Users } from '@/components/icons';
import { Badge } from '@/components/ui';

type Integration={status:string;updated_at:string;metadata:Record<string,unknown>|null};

export default function Integracoes(){
  const params=useSearchParams();
  const supabase=useMemo(()=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createBrowserClient(u,k):null},[]);
  const [google,setGoogle]=useState<Integration|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  async function load(){if(!supabase){setLoading(false);return}setLoading(true);setError('');const {data,error}=await supabase.from('integrations').select('status,updated_at,metadata').eq('provider','google_workspace').limit(1).maybeSingle();if(error)setError(error.message);else setGoogle(data as Integration|null);setLoading(false)}
  useEffect(()=>{load()},[supabase]);
  const connected=google?.status==='connected';const justConnected=params.get('google')==='connected';
  return <>
    <div className="page-head"><div><div className="eyebrow">Configurações</div><h1 className="page-title">Integrações</h1><p className="page-subtitle">Serviços conectados ao workspace, com status real vindo do banco.</p></div><div className="head-actions"><Link href="/configuracoes/usuarios" className="secondary-btn"><Users size={14}/> Equipe & acessos</Link><button className="secondary-btn" onClick={load}><RefreshCw size={14}/> Atualizar</button></div></div>
    {justConnected&&<div className="success-box" style={{marginBottom:14,display:'flex',alignItems:'center',gap:8}}><CheckCircle2 size={15}/> Google Workspace conectado com sucesso.</div>}{error&&<div className="success-box" style={{background:'#fff0f2',color:'#ba3b4d',marginBottom:14}}>{error}</div>}
    <div className="panel"><div className="panel-head"><div><div className="panel-title">Google Workspace</div><div className="panel-sub">Drive e Docs usando OAuth da conta da agência.</div></div>{loading?<Badge>Verificando…</Badge>:<Badge tone={connected?'green':'amber'}>{connected?'Conectado':'Não conectado'}</Badge>}</div><div className="panel-body stack">
      <div className="integration-card"><div className="integration-icon"><Cloud size={21}/></div><div className="integration-info"><strong>Google Drive</strong><span>{connected?`Conectado${google?.updated_at?` · atualizado em ${new Date(google.updated_at).toLocaleDateString('pt-BR')}`:''}. Uploads podem criar a estrutura Cliente → Campanha → Creator → Categoria.`:'Autorize a conta que deve armazenar contratos, briefings, conteúdos e arquivos da operação.'}</span></div><Badge tone={connected?'green':'amber'}>{connected?'Ativo':'Pendente'}</Badge><Link className="secondary-btn" href="/api/google/oauth/start">{connected?<><RefreshCw size={14}/> Reconectar</>:'Conectar'}</Link></div>
      <div className="integration-card"><div className="integration-icon"><Link2 size={21}/></div><div className="integration-info"><strong>Google Docs</strong><span>Permissão incluída no mesmo OAuth. O fluxo continua preservando preparação e revisão humana dos documentos.</span></div><Badge tone={connected?'green':'slate'}>{connected?'Autorizado':'Via Google OAuth'}</Badge></div>
      <div className="integration-card"><div className="integration-icon"><ShieldCheck size={21}/></div><div className="integration-info"><strong>Automação com controle humano</strong><span>Cadastro cria registro e tarefa; arquivos são organizados; contratos mudam de etapa manualmente. Decisões comerciais e revisão documental continuam humanas.</span></div><Badge tone="green">Ativo</Badge></div>
    </div></div>
  </>;
}
