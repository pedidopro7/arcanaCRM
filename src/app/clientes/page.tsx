'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Plus, ArrowUpRight, X, Building2 } from '@/components/icons';
import { Badge } from '@/components/ui';

type Client = { id:string; name:string; category:string|null; status:string; instagram:string|null; website:string|null; created_at:string };

export default function Clientes(){
  const [items,setItems]=useState<Client[]>([]);
  const [query,setQuery]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [orgId,setOrgId]=useState<string|null>(null);
  const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:'',category:'',instagram:'',website:''});

  const supabase=useMemo(()=>{
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url&&key?createBrowserClient(url,key):null;
  },[]);

  async function load(){
    if(!supabase){setError('Supabase não configurado.');setLoading(false);return;}
    setLoading(true);setError('');
    const {data:member,error:memberError}=await supabase.from('organization_members').select('organization_id').limit(1).maybeSingle();
    if(memberError||!member){setError('Seu usuário ainda não está vinculado a um workspace. Aplique a migration mais recente do projeto.');setLoading(false);return;}
    setOrgId(member.organization_id);
    const {data,error}=await supabase.from('clients').select('id,name,category,status,instagram,website,created_at').order('created_at',{ascending:false});
    if(error)setError(error.message); else setItems((data||[]) as Client[]);
    setLoading(false);
  }
  useEffect(()=>{load();},[supabase]);

  async function createClient(e:React.FormEvent){
    e.preventDefault(); if(!supabase||!orgId||!form.name.trim())return;
    setSaving(true);setError('');
    const {error}=await supabase.from('clients').insert({organization_id:orgId,name:form.name.trim(),category:form.category.trim()||null,instagram:form.instagram.trim()||null,website:form.website.trim()||null,status:'active'});
    if(error)setError(error.message); else {setForm({name:'',category:'',instagram:'',website:''});setOpen(false);await load();}
    setSaving(false);
  }

  const filtered=items.filter(c=>`${c.name} ${c.category||''} ${c.instagram||''}`.toLowerCase().includes(query.toLowerCase()));

  return <>
    <div className="page-head"><div><div className="eyebrow">Base da agência</div><h1 className="page-title">Clientes</h1><p className="page-subtitle">Marcas reais do workspace. Cadastre uma vez e conecte campanhas, creators, contratos, arquivos e histórico.</p></div><button className="primary-btn keep-text" onClick={()=>setOpen(v=>!v)}>{open?<X size={16}/>:<Plus size={16}/>} {open?'Fechar':'Novo cliente'}</button></div>

    {open&&<form className="form-card" onSubmit={createClient} style={{marginBottom:16}}><div className="form-section" style={{marginBottom:0,paddingBottom:0,borderBottom:0}}><h3>Novo cliente</h3><p>Os campos adicionais podem ser completados depois dentro do workspace da marca.</p><div className="form-grid"><div className="field"><label>Nome da marca *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Ex.: Vans"/></div><div className="field"><label>Categoria</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Moda, beleza, tech..."/></div><div className="field"><label>Instagram</label><input value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})} placeholder="@marca"/></div><div className="field"><label>Site</label><input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} placeholder="https://"/></div></div><div className="submit-row"><span className="privacy-note">O cliente será salvo no workspace atual.</span><button className="primary-btn keep-text" disabled={saving}>{saving?'Salvando…':'Salvar cliente'}</button></div></div></form>}

    <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Buscar cliente..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {error&&<div className="success-box" style={{background:'#fff0f2',color:'#ba3b4d',marginBottom:14}}>{error}</div>}
    {loading?<div className="panel"><div className="panel-body">Carregando clientes…</div></div>:filtered.length===0?<div className="panel"><div className="panel-body" style={{padding:32,textAlign:'center'}}><Building2 size={28}/><h3>Nenhum cliente encontrado</h3><p style={{color:'#6b6f82'}}>Cadastre a primeira marca para começar a operação real.</p></div></div>:<div className="client-grid">{filtered.map(c=><Link href={`/clientes/${c.id}`} key={c.id} className="client-card"><div className="client-card-top"><div className="client-logo">{c.name.split(/\s+/).map(v=>v[0]).join('').slice(0,2).toUpperCase()}</div><Badge tone={c.status==='active'?'green':'slate'}>{c.status==='active'?'Ativo':c.status}</Badge></div><h3>{c.name}</h3><p>{c.category||'Categoria não informada'}</p><div className="client-stats"><div className="client-stat"><strong>—</strong><span>Campanhas</span></div><div className="client-stat"><strong>—</strong><span>Creators</span></div><div className="client-stat"><strong>—</strong><span>Pendências</span></div></div><div className="client-bottom"><span>{c.instagram||'Instagram não informado'}</span><span>Abrir workspace <ArrowUpRight size={11} style={{display:'inline'}}/></span></div></Link>)}</div>}
  </>;
}
