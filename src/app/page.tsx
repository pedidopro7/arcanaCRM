'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MetricCard, Badge, Progress, SectionTitle } from '@/components/ui';
import { BriefcaseBusiness, Users, FileCheck2, CircleAlert, ArrowUpRight, Clock3, Package, MessageSquareText, ClipboardList } from '@/components/icons';

type Campaign={id:string;name:string;status:string;phase:string;ends_at:string|null;clients?:{name:string}|null};
type Task={id:string;title:string;type:string;priority:string;waiting_for:string;due_at:string|null;clients?:{name:string}|null};

const phaseProgress=(phase:string)=>({briefing:10,casting:28,approval:42,negotiation:56,contract:68,content:80,publication:92,completed:100}[phase]||15);
const campaignTone=(s:string)=>s==='execution'||s==='active'?'green':s==='planning'?'blue':s==='paused'?'amber':'slate';

export default function Dashboard(){
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const [counts,setCounts]=useState({clients:0,influencers:0,contracts:0,attention:0,waitingClient:0,waitingInfluencer:0,logistics:0,content:0});
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);const [tasks,setTasks]=useState<Task[]>([]);
  const supabase=useMemo(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createBrowserClient(url,key):null;},[]);

  useEffect(()=>{(async()=>{
    if(!supabase){setError('Supabase não configurado.');setLoading(false);return;}
    setLoading(true);setError('');
    const {data:member}=await supabase.from('organization_members').select('organization_id').limit(1).maybeSingle();
    if(!member){setError('Seu usuário ainda não está vinculado ao workspace.');setLoading(false);return;}
    const today=new Date();const dayEnd=new Date(today);dayEnd.setHours(23,59,59,999);
    const [clientsQ,influencersQ,contractsQ,attentionQ,waitingClientQ,waitingInfluencerQ,logisticsQ,contentQ,campaignQ,taskQ]=await Promise.all([
      supabase.from('clients').select('*',{count:'exact',head:true}).eq('status','active'),
      supabase.from('influencers').select('*',{count:'exact',head:true}),
      supabase.from('contracts').select('*',{count:'exact',head:true}).neq('status','complete'),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').lte('due_at',dayEnd.toISOString()).eq('waiting_for','internal'),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').eq('waiting_for','client'),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').eq('waiting_for','influencer'),
      supabase.from('shipments').select('*',{count:'exact',head:true}).not('status','in','("delivered","cancelled")'),
      supabase.from('deliverables').select('*',{count:'exact',head:true}).not('status','in','("published","complete")'),
      supabase.from('campaigns').select('id,name,status,phase,ends_at,clients(name)').neq('status','completed').order('created_at',{ascending:false}).limit(4),
      supabase.from('tasks').select('id,title,type,priority,waiting_for,due_at,clients(name)').neq('status','done').order('due_at',{ascending:true,nullsFirst:false}).limit(6)
    ]);
    const err=[clientsQ,influencersQ,contractsQ,attentionQ,campaignQ,taskQ].find(q=>q.error)?.error;
    if(err)setError(err.message);
    setCounts({clients:clientsQ.count||0,influencers:influencersQ.count||0,contracts:contractsQ.count||0,attention:attentionQ.count||0,waitingClient:waitingClientQ.count||0,waitingInfluencer:waitingInfluencerQ.count||0,logistics:logisticsQ.count||0,content:contentQ.count||0});
    setCampaigns((campaignQ.data||[]) as unknown as Campaign[]);setTasks((taskQ.data||[]) as unknown as Task[]);setLoading(false);
  })();},[supabase]);

  const fmtDue=(d:string|null)=>d?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(d)):'Sem prazo';
  const taskIcon=(type:string)=>type==='contract'?FileCheck2:type==='logistics'?Package:type==='content'?MessageSquareText:ClipboardList;
  const todayLabel=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date());

  return <>
    <div className="page-head"><div><div className="eyebrow">{todayLabel}</div><h1 className="page-title">Visão geral da operação</h1><p className="page-subtitle">Dados reais do workspace: o que precisa de atenção agora, sem planilhas paralelas.</p></div><div className="head-actions"><Link href="/campanhas" className="secondary-btn">Ver campanhas</Link><Link href="/operacoes" className="primary-btn keep-text">Abrir meu dia <ArrowUpRight size={16}/></Link></div></div>
    {error&&<div className="success-box" style={{background:'#fff0f2',color:'#ba3b4d',marginBottom:14}}>{error}</div>}
    <div className="grid-metrics"><MetricCard label="Clientes ativos" value={loading?'…':counts.clients} meta="marcas no workspace" icon={<BriefcaseBusiness size={16}/>}/><MetricCard label="Influenciadores" value={loading?'…':counts.influencers} meta="base cadastrada" icon={<Users size={16}/>}/><MetricCard label="Contratos pendentes" value={loading?'…':counts.contracts} meta="ainda não concluídos" icon={<FileCheck2 size={16}/>}/><MetricCard label="Precisa de atenção" value={loading?'…':counts.attention} meta="tarefas internas vencendo/atrasadas" icon={<CircleAlert size={16}/>} accent/></div>
    <div className="two-col"><section className="panel"><div className="panel-head"><div><div className="panel-title">Campanhas em andamento</div><div className="panel-sub">Etapa atual e prazo das campanhas abertas.</div></div><Link className="ghost-btn" href="/campanhas">Ver todas <ArrowUpRight size={15}/></Link></div><div>{loading?<div className="panel-body">Carregando…</div>:campaigns.length===0?<div className="panel-body">Nenhuma campanha ativa.</div>:campaigns.map(c=>{const p=phaseProgress(c.phase);return <Link key={c.id} href={`/campanhas/${c.id}`} className="campaign-card" style={{display:'block',textDecoration:'none',color:'inherit'}}><div className="campaign-row"><div><div className="campaign-name">{c.name}</div><div className="campaign-client">{c.clients?.name||'Cliente'} · {c.phase}</div></div><Badge tone={campaignTone(c.status) as any}>{c.status}</Badge></div><div style={{display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center',gap:12,marginTop:12}}><Progress value={p}/><span style={{fontSize:10,color:'#777'}}>{p}% · {c.ends_at?`até ${fmtDue(c.ends_at)}`:'sem prazo'}</span></div></Link>})}</div></section>
    <section className="panel"><div className="panel-head"><div><div className="panel-title">Meu dia</div><div className="panel-sub">Próximas ações do banco.</div></div><Link className="ghost-btn" href="/operacoes">Abrir</Link></div><div className="panel-body task-list">{loading?<div>Carregando…</div>:tasks.length===0?<div>Nenhuma tarefa aberta.</div>:tasks.map(t=>{const Icon=taskIcon(t.type);return <div className="task-row" key={t.id}><div className="task-icon"><Icon size={14}/></div><div><div className="task-title">{t.title}</div><div className="task-meta"><span>{t.clients?.name||'Geral'}</span><span>•</span><span>{t.waiting_for==='internal'?'Interno':`Aguardando ${t.waiting_for}`}</span></div></div><div className="task-due">{fmtDue(t.due_at)}</div></div>})}</div></section></div>
    <SectionTitle eyebrow="Controle" title="Pendências por etapa" description="Onde a operação está acumulando trabalho agora." />
    <div className="grid-metrics"><MetricCard label="Aguardando cliente" value={counts.waitingClient} meta="tarefas bloqueadas pelo cliente" icon={<Clock3 size={16}/>}/><MetricCard label="Aguardando influencer" value={counts.waitingInfluencer} meta="dados, conteúdo, retornos" icon={<Users size={16}/>}/><MetricCard label="Logística" value={counts.logistics} meta="envios ainda não entregues" icon={<Package size={16}/>}/><MetricCard label="Conteúdo" value={counts.content} meta="entregáveis ainda abertos" icon={<MessageSquareText size={16}/>}/></div>
  </>;
}
