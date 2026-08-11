'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { PageHeader, Stat, Badge, Progress, EmptyState, SkeletonRows } from '@/components/ui';
import { BriefcaseBusiness, Users, FileCheck2, CircleAlert, ArrowUpRight, Clock3, Package, MessageSquareText, ClipboardList, CheckCircle2 } from '@/components/icons';

type Campaign={id:string;name:string;status:string;phase:string;ends_at:string|null;health:string|null;clients?:{name:string}|null};
type Task={id:string;title:string;type:string;priority:string;waiting_for:string;due_at:string|null;clients?:{name:string}|null;campaigns?:{name:string}|null};

const phaseProgress=(phase:string)=>({briefing:10,casting:25,approval:40,negotiation:55,contract:67,logistics:75,content:84,publication:94,completed:100}[phase]||15);
const tone=(status:string)=>status==='execution'||status==='active'?'green':status==='planning'?'blue':status==='paused'?'amber':'slate';

export default function Dashboard(){
  const supabase=useMemo(()=>getSupabaseBrowser(),[]);
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const [counts,setCounts]=useState({clients:0,influencers:0,contracts:0,attention:0,overdue:0,today:0,blocked:0,waitingClient:0,waitingInfluencer:0,logistics:0,content:0});
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);const [tasks,setTasks]=useState<Task[]>([]);

  useEffect(()=>{(async()=>{
    if(!supabase){setError('Supabase não configurado.');setLoading(false);return}
    setLoading(true);setError('');const now=new Date();const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());const end=new Date(start);end.setDate(end.getDate()+1);
    const qs=await Promise.all([
      supabase.from('clients').select('*',{count:'exact',head:true}).eq('status','active'),
      supabase.from('influencers').select('*',{count:'exact',head:true}),
      supabase.from('contracts').select('*',{count:'exact',head:true}).neq('status','complete'),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').eq('waiting_for','internal').lt('due_at',end.toISOString()),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').eq('waiting_for','internal').lt('due_at',start.toISOString()),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').eq('waiting_for','internal').gte('due_at',start.toISOString()).lt('due_at',end.toISOString()),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').neq('waiting_for','internal'),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').eq('waiting_for','client'),
      supabase.from('tasks').select('*',{count:'exact',head:true}).neq('status','done').eq('waiting_for','influencer'),
      supabase.from('shipments').select('*',{count:'exact',head:true}).not('status','in','("delivered","cancelled")'),
      supabase.from('deliverables').select('*',{count:'exact',head:true}).not('status','in','("published","complete")'),
      supabase.from('campaigns').select('id,name,status,phase,ends_at,health,clients(name)').neq('status','completed').order('updated_at',{ascending:false}).limit(4),
      supabase.from('tasks').select('id,title,type,priority,waiting_for,due_at,clients(name),campaigns(name)').neq('status','done').order('due_at',{ascending:true,nullsFirst:false}).limit(7),
    ]);
    const err=qs.find((q:any)=>q.error)?.error;if(err)setError(err.message);
    setCounts({clients:qs[0].count||0,influencers:qs[1].count||0,contracts:qs[2].count||0,attention:qs[3].count||0,overdue:qs[4].count||0,today:qs[5].count||0,blocked:qs[6].count||0,waitingClient:qs[7].count||0,waitingInfluencer:qs[8].count||0,logistics:qs[9].count||0,content:qs[10].count||0});
    setCampaigns((qs[11].data||[]) as unknown as Campaign[]);setTasks((qs[12].data||[]) as unknown as Task[]);setLoading(false);
  })()},[supabase]);

  const todayLabel=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date());
  const fmt=(d:string|null)=>d?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(d)):'sem prazo';

  return <>
    <PageHeader eyebrow={todayLabel} title="Sua operação, sem ruído." description="O Arcana prioriza o que exige ação e separa claramente o que está aguardando terceiros." action={<Link href="/operacoes" className="primary-btn">Abrir Meu Dia <ArrowUpRight size={14}/></Link>} secondary={<Link href="/campanhas" className="secondary-btn">Campanhas</Link>}/>
    {error&&<div className="error-box" style={{marginBottom:12}}>{error}</div>}

    <div className="priority-hero">
      <section className="attention-card"><div className="attention-top"><div><div className="eyebrow" style={{color:'rgba(255,255,255,.58)'}}>Prioridade operacional</div><h2>{loading?'—':counts.attention}</h2><p>itens internos precisam de atenção até o fim do dia.</p></div><CircleAlert size={24}/></div><div className="attention-mini"><div><strong>{counts.overdue}</strong><span>Atrasadas</span></div><div><strong>{counts.today}</strong><span>Hoje</span></div><div><strong>{counts.blocked}</strong><span>Bloqueadas</span></div></div></section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Aguardando respostas</div><div className="panel-sub">O que não depende de você agora.</div></div><Clock3 size={16}/></div><div className="panel-body"><div className="detail-grid"><div className="detail-box"><span>Cliente</span><strong>{counts.waitingClient} pendências</strong></div><div className="detail-box"><span>Creator</span><strong>{counts.waitingInfluencer} pendências</strong></div><div className="detail-box"><span>Logística</span><strong>{counts.logistics} em aberto</strong></div><div className="detail-box"><span>Conteúdo</span><strong>{counts.content} entregáveis</strong></div></div></div></section>
    </div>

    <div className="grid-stats"><Stat label="Clientes ativos" value={loading?'…':counts.clients} meta="marcas no workspace" icon={<BriefcaseBusiness size={15}/>}/><Stat label="Creators" value={loading?'…':counts.influencers} meta="base centralizada" icon={<Users size={15}/>}/><Stat label="Contratos pendentes" value={loading?'…':counts.contracts} meta="ainda não concluídos" icon={<FileCheck2 size={15}/>}/><Stat label="Operação aberta" value={loading?'…':counts.logistics+counts.content} meta="logística + conteúdo" icon={<ClipboardList size={15}/>} emphasis/></div>

    <div className="two-col">
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Campanhas em andamento</div><div className="panel-sub">Saúde, etapa e prazo das campanhas abertas.</div></div><Link href="/campanhas" className="ghost-btn">Ver todas <ArrowUpRight size={13}/></Link></div>{loading?<SkeletonRows count={4}/>:campaigns.length===0?<EmptyState icon={<BriefcaseBusiness size={20}/>} title="Nenhuma campanha ativa" description="Crie a primeira campanha para começar a acompanhar o fluxo." action={<Link href="/campanhas?new=1" className="primary-btn">Nova campanha</Link>}/>:<div>{campaigns.map(c=>{const p=phaseProgress(c.phase);return <Link href={`/campanhas/${c.id}`} className="campaign-card" key={c.id} style={{display:'block',padding:14,textDecoration:'none',borderBottom:'1px solid #f0f1f4'}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div className="name-cell"><strong>{c.name}</strong><span>{c.clients?.name||'Cliente'} · {c.phase}</span></div><div style={{display:'flex',gap:6,alignItems:'center'}}><span className={`health-dot health-${c.health==='risk'?'risk':c.health==='watch'?'watch':'good'}`}>{c.health==='risk'?'Risco':c.health==='watch'?'Atenção':'No prazo'}</span><Badge tone={tone(c.status) as any}>{c.status}</Badge></div></div><div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'center',marginTop:11}}><Progress value={p}/><span style={{fontSize:8,color:'#777'}}>{p}% · {fmt(c.ends_at)}</span></div></Link>})}</div>}</section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Próximas ações</div><div className="panel-sub">Ordenadas pelo que exige resposta.</div></div><Link href="/operacoes" className="ghost-btn">Abrir</Link></div><div className="panel-body task-list">{loading?<SkeletonRows count={5}/>:tasks.length===0?<EmptyState icon={<CheckCircle2 size={20}/>} title="Nada pendente" description="Seu Meu Dia está limpo por enquanto."/>:tasks.map(t=><div className="task-row" key={t.id}><div className="task-icon"><ClipboardList size={14}/></div><div><div className="task-title">{t.title}</div><div className="task-meta"><span>{t.clients?.name||'Geral'}</span><span>•</span><span>{t.waiting_for==='internal'?'Interno':`Aguardando ${t.waiting_for}`}</span></div></div><div className={`task-due ${t.priority==='high'?'overdue':''}`}>{fmt(t.due_at)}</div></div>)}</div></section>
    </div>

    <div className="section-head"><div><h2>Fluxos que estão acumulando trabalho</h2><p>Uma leitura rápida do gargalo operacional.</p></div></div>
    <div className="grid-stats"><Stat compact label="Aguardando cliente" value={counts.waitingClient} icon={<Clock3 size={15}/>}/><Stat compact label="Aguardando creator" value={counts.waitingInfluencer} icon={<Users size={15}/>}/><Stat compact label="Produtos & envios" value={counts.logistics} icon={<Package size={15}/>}/><Stat compact label="Conteúdo" value={counts.content} icon={<MessageSquareText size={15}/>}/></div>
  </>;
}
