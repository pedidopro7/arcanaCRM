'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Plus, MoreHorizontal, X, Megaphone } from '@/components/icons';
import { Badge, Progress } from '@/components/ui';

type Campaign={id:string;name:string;status:string;phase:string;starts_at:string|null;ends_at:string|null;budget_total:number|null;client_id:string;clients?:{name:string}|null};
type Client={id:string;name:string};

const tone=(status:string)=>status==='active'||status==='execution'?'green':status==='planning'?'blue':status==='paused'?'amber':'slate';

export default function Campanhas(){
  const [items,setItems]=useState<Campaign[]>([]);const [clients,setClients]=useState<Client[]>([]);const [orgId,setOrgId]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [query,setQuery]=useState('');const [open,setOpen]=useState(false);const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:'',client_id:'',objective:'',starts_at:'',ends_at:'',budget_total:''});
  const supabase=useMemo(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createBrowserClient(url,key):null;},[]);

  async function load(){
    if(!supabase){setError('Supabase não configurado.');setLoading(false);return;}setLoading(true);setError('');
    const {data:member}=await supabase.from('organization_members').select('organization_id').limit(1).maybeSingle();
    if(!member){setError('Seu usuário ainda não está vinculado ao workspace.');setLoading(false);return;}setOrgId(member.organization_id);
    const [{data:campaignData,error:campaignError},{data:clientData,error:clientError}]=await Promise.all([
      supabase.from('campaigns').select('id,name,status,phase,starts_at,ends_at,budget_total,client_id,clients(name)').order('created_at',{ascending:false}),
      supabase.from('clients').select('id,name').eq('status','active').order('name')
    ]);
    if(campaignError||clientError)setError(campaignError?.message||clientError?.message||'Erro ao carregar dados.');
    setItems((campaignData||[]) as unknown as Campaign[]);setClients((clientData||[]) as Client[]);setLoading(false);
  }
  useEffect(()=>{load();},[supabase]);

  async function createCampaign(e:React.FormEvent){
    e.preventDefault();if(!supabase||!orgId||!form.name.trim()||!form.client_id)return;setSaving(true);setError('');
    const {error}=await supabase.from('campaigns').insert({organization_id:orgId,client_id:form.client_id,name:form.name.trim(),objective:form.objective.trim()||null,status:'planning',phase:'briefing',starts_at:form.starts_at||null,ends_at:form.ends_at||null,budget_total:form.budget_total?Number(form.budget_total):null});
    if(error)setError(error.message);else{setForm({name:'',client_id:'',objective:'',starts_at:'',ends_at:'',budget_total:''});setOpen(false);await load();}setSaving(false);
  }

  const filtered=items.filter(c=>`${c.name} ${c.clients?.name||''} ${c.phase}`.toLowerCase().includes(query.toLowerCase()));
  const progress=(phase:string)=>({briefing:10,casting:28,approval:42,negotiation:56,contract:68,content:80,publication:92,completed:100}[phase]||15);

  return <>
    <div className="page-head"><div><div className="eyebrow">Operação</div><h1 className="page-title">Campanhas</h1><p className="page-subtitle">Campanhas reais conectadas aos clientes, com etapa, prazo e orçamento em um único fluxo.</p></div><button className="primary-btn keep-text" onClick={()=>setOpen(v=>!v)}>{open?<X size={16}/>:<Plus size={16}/>} {open?'Fechar':'Nova campanha'}</button></div>
    {open&&<form className="form-card" onSubmit={createCampaign} style={{marginBottom:16}}><div className="form-section" style={{marginBottom:0,paddingBottom:0,borderBottom:0}}><h3>Nova campanha</h3><p>Começa em briefing e depois avança pelo fluxo operacional.</p><div className="form-grid three"><div className="field"><label>Nome *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="field"><label>Cliente *</label><select required value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})}><option value="">Selecione</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="field"><label>Orçamento total</label><input type="number" min="0" step="0.01" value={form.budget_total} onChange={e=>setForm({...form,budget_total:e.target.value})}/></div><div className="field"><label>Início</label><input type="date" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/></div><div className="field"><label>Fim</label><input type="date" value={form.ends_at} onChange={e=>setForm({...form,ends_at:e.target.value})}/></div><div className="field"><label>Objetivo</label><input value={form.objective} onChange={e=>setForm({...form,objective:e.target.value})} placeholder="Awareness, conversão, lançamento..."/></div></div><div className="submit-row"><span className="privacy-note">A campanha ficará vinculada ao cliente escolhido.</span><button className="primary-btn keep-text" disabled={saving}>{saving?'Salvando…':'Criar campanha'}</button></div></div></form>}
    <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Buscar campanha ou cliente..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {error&&<div className="success-box" style={{background:'#fff0f2',color:'#ba3b4d',marginBottom:14}}>{error}</div>}
    {loading?<div className="panel"><div className="panel-body">Carregando campanhas…</div></div>:filtered.length===0?<div className="panel"><div className="panel-body" style={{padding:32,textAlign:'center'}}><Megaphone size={28}/><h3>Nenhuma campanha encontrada</h3><p style={{color:'#6b6f82'}}>Crie a primeira campanha para iniciar o fluxo real.</p></div></div>:<div className="panel table-wrap"><table className="data-table"><thead><tr><th>Campanha</th><th>Status</th><th>Etapa atual</th><th>Progresso</th><th>Período</th><th>Orçamento</th><th></th></tr></thead><tbody>{filtered.map(c=>{const p=progress(c.phase);return <tr key={c.id}><td><Link href={`/campanhas/${c.id}`} style={{textDecoration:'none',color:'inherit'}} className="name-cell"><strong>{c.name}</strong><span>{c.clients?.name||'Cliente'}</span></Link></td><td><Badge tone={tone(c.status) as any}>{c.status}</Badge></td><td>{c.phase}</td><td style={{minWidth:150}}><div style={{display:'flex',alignItems:'center',gap:9}}><Progress value={p}/><span>{p}%</span></div></td><td>{c.starts_at||'—'} → {c.ends_at||'—'}</td><td>{c.budget_total!=null?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(c.budget_total)):'—'}</td><td><MoreHorizontal size={16}/></td></tr>})}</tbody></table></div>}
  </>;
}
