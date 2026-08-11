'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Badge, MetricCard, Progress } from '@/components/ui';
import { ArrowUpRight, Clock3, Users, Megaphone, FileCheck2 } from '@/components/icons';

type Client={id:string;name:string;category:string|null;website:string|null;instagram:string|null;status:string;notes:string|null};
type Campaign={id:string;name:string;status:string;phase:string;ends_at:string|null};
type Task={id:string;title:string;type:string;waiting_for:string;due_at:string|null};

export default function ClientWorkspace(){
 const params=useParams<{id:string}>(); const id=params.id;
 const supabase=useMemo(()=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createBrowserClient(u,k):null},[]);
 const [client,setClient]=useState<Client|null>(null); const [campaigns,setCampaigns]=useState<Campaign[]>([]); const [tasks,setTasks]=useState<Task[]>([]); const [creatorCount,setCreatorCount]=useState(0); const [contractCount,setContractCount]=useState(0); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
 useEffect(()=>{(async()=>{if(!supabase)return;setLoading(true);const [cq,camq,tq,ciq,coq]=await Promise.all([
   supabase.from('clients').select('id,name,category,website,instagram,status,notes').eq('id',id).maybeSingle(),
   supabase.from('campaigns').select('id,name,status,phase,ends_at').eq('client_id',id).order('created_at',{ascending:false}),
   supabase.from('tasks').select('id,title,type,waiting_for,due_at').eq('client_id',id).neq('status','done').order('due_at',{ascending:true,nullsFirst:false}).limit(6),
   supabase.from('campaign_influencers').select('influencer_id,campaigns!inner(client_id)',{count:'exact',head:true}).eq('campaigns.client_id',id),
   supabase.from('contracts').select('*',{count:'exact',head:true}).eq('client_id',id).neq('status','complete')
 ]);if(cq.error||!cq.data)setError(cq.error?.message||'Cliente não encontrado.');else setClient(cq.data as Client);setCampaigns((camq.data||[]) as Campaign[]);setTasks((tq.data||[]) as Task[]);setCreatorCount(ciq.count||0);setContractCount(coq.count||0);setLoading(false)})()},[supabase,id]);
 if(loading)return <div className="panel"><div className="panel-body">Carregando workspace…</div></div>;
 if(error||!client)return <><div className="breadcrumb"><Link href="/clientes">Clientes</Link></div><div className="panel"><div className="panel-body">{error||'Cliente não encontrado.'}</div></div></>;
 const initials=client.name.split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase(); const active=campaigns.filter(c=>c.status!=='completed').length;
 const phaseProgress=(p:string)=>({briefing:10,casting:28,approval:42,negotiation:56,contract:68,content:80,publication:92,completed:100}[p]||15);
 return <>
  <div className="breadcrumb"><Link href="/clientes">Clientes</Link><span>/</span><span>{client.name}</span></div>
  <div className="workspace-hero"><div className="workspace-hero-top"><div className="workspace-client"><div className="client-logo">{initials}</div><div><h1>{client.name}</h1><p>{client.category||'Categoria não informada'}{client.instagram?` · ${client.instagram}`:''}</p></div></div><div className="head-actions"><Link href="/campanhas" className="primary-btn">Nova campanha</Link></div></div><div className="workspace-tags"><Badge tone={client.status==='active'?'green':'slate'}>{client.status==='active'?'Cliente ativo':client.status}</Badge><Badge>{active} campanhas abertas</Badge><Badge>{creatorCount} participações de creators</Badge></div></div>
  <div className="grid-metrics"><MetricCard label="Campanhas abertas" value={active} icon={<Megaphone size={16}/>}/><MetricCard label="Creators no histórico" value={creatorCount} icon={<Users size={16}/>}/><MetricCard label="Pendências" value={tasks.length} icon={<Clock3 size={16}/>} accent/><MetricCard label="Contratos pendentes" value={contractCount} icon={<FileCheck2 size={16}/>}/></div>
  <div className="overview-grid"><section className="panel"><div className="panel-head"><div><div className="panel-title">Campanhas da marca</div><div className="panel-sub">Dados reais ligados a este cliente.</div></div><Link href="/campanhas" className="ghost-btn">Abrir todas <ArrowUpRight size={14}/></Link></div>{campaigns.length===0?<div className="panel-body">Nenhuma campanha cadastrada.</div>:campaigns.map(c=><Link href={`/campanhas/${c.id}`} className="campaign-card" key={c.id} style={{display:'block',textDecoration:'none',color:'inherit'}}><div className="campaign-row"><div><div className="campaign-name">{c.name}</div><div className="campaign-client">{c.phase}{c.ends_at?` · até ${new Date(c.ends_at+'T12:00:00').toLocaleDateString('pt-BR')}`:''}</div></div><Badge tone={c.status==='active'?'green':'blue'}>{c.status}</Badge></div><Progress value={phaseProgress(c.phase)}/></Link>)}</section>
  <section className="panel"><div className="panel-head"><div><div className="panel-title">Precisa de atenção</div><div className="panel-sub">Pendências abertas deste cliente.</div></div></div><div className="panel-body task-list">{tasks.length===0?<div>Nenhuma pendência aberta.</div>:tasks.map(t=><div className="task-row" key={t.id}><div className="task-icon"><Clock3 size={14}/></div><div><div className="task-title">{t.title}</div><div className="task-meta"><span>{t.type}</span><span>•</span><span>{t.waiting_for==='internal'?'Interno':`Aguardando ${t.waiting_for}`}</span></div></div><div className="task-due">{t.due_at?new Date(t.due_at).toLocaleDateString('pt-BR'):'Sem prazo'}</div></div>)}</div></section></div>
  <div className="panel" style={{marginTop:16}}><div className="panel-head"><div><div className="panel-title">Dados da marca</div><div className="panel-sub">Informações permanentes do cadastro.</div></div></div><div className="panel-body"><div className="details-grid"><div className="detail-box"><span>Categoria</span><strong>{client.category||'—'}</strong></div><div className="detail-box"><span>Instagram</span><strong>{client.instagram||'—'}</strong></div><div className="detail-box"><span>Site</span><strong>{client.website||'—'}</strong></div><div className="detail-box"><span>Observações</span><strong>{client.notes||'—'}</strong></div></div></div></div>
 </>;
}
