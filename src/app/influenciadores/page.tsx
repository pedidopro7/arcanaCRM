'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Plus, MoreHorizontal, X, Users } from '@/components/icons';
import { Badge } from '@/components/ui';

type Influencer={id:string;full_name:string;stage_name:string|null;email:string;instagram:string|null;niche:string|null;instagram_followers:number|null;city:string|null;state:string|null;status:string;internal_rating:string|null;created_at:string};
const tone=(status:string)=>status==='active'||status==='in_campaign'?'green':status.includes('contract')?'amber':status==='new_intake'?'blue':status==='incomplete'?'red':'slate';
const label=(status:string)=>({new_intake:'Novo cadastro',active:'Ativo',in_campaign:'Em campanha',contract_pending:'Contrato pendente',incomplete:'Cadastro incompleto'}[status]||status);

export default function Influencers(){
  const [items,setItems]=useState<Influencer[]>([]);const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [orgId,setOrgId]=useState<string|null>(null);const [open,setOpen]=useState(false);const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({full_name:'',email:'',instagram:'',phone:'',niche:'',city:'',state:''});
  const supabase=useMemo(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createBrowserClient(url,key):null;},[]);

  async function load(){
    if(!supabase){setError('Supabase não configurado.');setLoading(false);return;}setLoading(true);setError('');
    const {data:member}=await supabase.from('organization_members').select('organization_id').limit(1).maybeSingle();
    if(!member){setError('Seu usuário ainda não está vinculado ao workspace.');setLoading(false);return;}setOrgId(member.organization_id);
    const {data,error}=await supabase.from('influencers').select('id,full_name,stage_name,email,instagram,niche,instagram_followers,city,state,status,internal_rating,created_at').order('created_at',{ascending:false});
    if(error)setError(error.message);else setItems((data||[]) as Influencer[]);setLoading(false);
  }
  useEffect(()=>{load();},[supabase]);

  async function createInfluencer(e:React.FormEvent){
    e.preventDefault();if(!supabase||!orgId||!form.full_name.trim()||!form.email.trim())return;setSaving(true);setError('');
    const {data:created,error}=await supabase.from('influencers').insert({organization_id:orgId,full_name:form.full_name.trim(),email:form.email.trim().toLowerCase(),instagram:form.instagram.trim()||null,phone:form.phone.trim()||null,niche:form.niche.trim()||null,city:form.city.trim()||null,state:form.state.trim().toUpperCase()||null,status:'new_intake',intake_source:'internal'}).select('id,full_name').single();
    if(error)setError(error.message);else{
      if(created)await supabase.from('tasks').insert({organization_id:orgId,influencer_id:created.id,title:`Revisar cadastro — ${created.full_name}`,type:'registration',status:'todo',priority:'medium',waiting_for:'internal'});
      setForm({full_name:'',email:'',instagram:'',phone:'',niche:'',city:'',state:''});setOpen(false);await load();
    }setSaving(false);
  }

  const filtered=items.filter(i=>`${i.full_name} ${i.stage_name||''} ${i.instagram||''} ${i.niche||''} ${i.city||''}`.toLowerCase().includes(query.toLowerCase()));
  const fmt=(n:number|null)=>n==null?'—':n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${Math.round(n/1000)}k`:String(n);

  return <>
    <div className="page-head"><div><div className="eyebrow">Base de creators</div><h1 className="page-title">Influenciadores</h1><p className="page-subtitle">Cadastro único e real, com dados reaproveitados em campanhas, contratos, logística e histórico.</p></div><div className="head-actions"><Link href="/formularios/cadastro" className="secondary-btn">Abrir formulário público</Link><button className="primary-btn keep-text" onClick={()=>setOpen(v=>!v)}>{open?<X size={16}/>:<Plus size={16}/>} {open?'Fechar':'Novo influencer'}</button></div></div>
    {open&&<form className="form-card" onSubmit={createInfluencer} style={{marginBottom:16}}><div className="form-section" style={{marginBottom:0,paddingBottom:0,borderBottom:0}}><h3>Cadastro rápido</h3><p>Para cadastro completo, envie o formulário público ao creator.</p><div className="form-grid three"><div className="field"><label>Nome completo *</label><input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></div><div className="field"><label>E-mail *</label><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><div className="field"><label>Instagram</label><input value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})} placeholder="@creator"/></div><div className="field"><label>Telefone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div><div className="field"><label>Nicho</label><input value={form.niche} onChange={e=>setForm({...form,niche:e.target.value})}/></div><div className="field"><label>Cidade / UF</label><div style={{display:'grid',gridTemplateColumns:'1fr 72px',gap:8}}><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><input maxLength={2} value={form.state} onChange={e=>setForm({...form,state:e.target.value})} placeholder="SP"/></div></div></div><div className="submit-row"><span className="privacy-note">Será criada automaticamente uma tarefa de revisão do cadastro.</span><button className="primary-btn keep-text" disabled={saving}>{saving?'Salvando…':'Salvar influencer'}</button></div></div></form>}
    <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Nome, @, nicho ou cidade..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {error&&<div className="success-box" style={{background:'#fff0f2',color:'#ba3b4d',marginBottom:14}}>{error}</div>}
    {loading?<div className="panel"><div className="panel-body">Carregando influenciadores…</div></div>:filtered.length===0?<div className="panel"><div className="panel-body" style={{padding:32,textAlign:'center'}}><Users size={28}/><h3>Nenhum influencer encontrado</h3><p style={{color:'#6b6f82'}}>Use o cadastro rápido ou envie o formulário público.</p></div></div>:<div className="panel table-wrap"><table className="data-table"><thead><tr><th>Influencer</th><th>Nicho</th><th>Base IG</th><th>Status</th><th>E-mail</th><th>Histórico</th><th></th></tr></thead><tbody>{filtered.map(i=><tr key={i.id}><td><Link href={`/influenciadores/${i.id}`} className="person" style={{textDecoration:'none',color:'inherit'}}><div className="mini-avatar">{i.full_name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div><div className="name-cell"><strong>{i.stage_name||i.full_name}</strong><span>{i.instagram||'sem @'} · {[i.city,i.state].filter(Boolean).join('/')||'local não informado'}</span></div></Link></td><td>{i.niche||'—'}</td><td>{fmt(i.instagram_followers)}</td><td><Badge tone={tone(i.status) as any}>{label(i.status)}</Badge></td><td>{i.email}</td><td><Badge tone={i.internal_rating==='preferred'?'violet':'slate'}>{i.internal_rating==='preferred'?'Preferido':i.internal_rating||'Sem nota'}</Badge></td><td><MoreHorizontal size={16}/></td></tr>)}</tbody></table></div>}
  </>;
}
