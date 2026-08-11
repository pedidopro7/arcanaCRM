'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Badge } from '@/components/ui';
import { Search, Plus, Clock3, FileCheck2, Package, MessageSquareText, CircleDollarSign, ClipboardList, CalendarClock, X, CheckCircle2 } from '@/components/icons';

type Task={id:string;title:string;description:string|null;type:string;status:string;priority:string;waiting_for:string;due_at:string|null;assignee_user_id:string|null;clients?:{name:string}|null;campaigns?:{name:string}|null};
type Client={id:string;name:string};

const taskIcon=(type:string)=>type==='contract'?FileCheck2:type==='logistics'?Package:type==='content'?MessageSquareText:type==='finance'?CircleDollarSign:ClipboardList;
const priorityTone=(p:string)=>p==='high'?'red':p==='medium'?'amber':'slate';
const priorityLabel=(p:string)=>p==='high'?'Alta':p==='medium'?'Média':'Baixa';

export default function Operacoes(){
  const [tasks,setTasks]=useState<Task[]>([]);const [clients,setClients]=useState<Client[]>([]);const [orgId,setOrgId]=useState<string|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [query,setQuery]=useState('');const [open,setOpen]=useState(false);const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({title:'',description:'',type:'general',priority:'medium',waiting_for:'internal',due_at:'',client_id:''});
  const supabase=useMemo(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createBrowserClient(url,key):null;},[]);

  async function load(){
    if(!supabase){setError('Supabase não configurado.');setLoading(false);return;}setLoading(true);setError('');
    const {data:member}=await supabase.from('organization_members').select('organization_id').limit(1).maybeSingle();
    if(!member){setError('Seu usuário ainda não está vinculado ao workspace.');setLoading(false);return;}setOrgId(member.organization_id);
    const [{data:taskData,error:taskError},{data:clientData}]=await Promise.all([
      supabase.from('tasks').select('id,title,description,type,status,priority,waiting_for,due_at,assignee_user_id,clients(name),campaigns(name)').neq('status','done').order('due_at',{ascending:true,nullsFirst:false}),
      supabase.from('clients').select('id,name').eq('status','active').order('name')
    ]);
    if(taskError)setError(taskError.message);setTasks((taskData||[]) as unknown as Task[]);setClients((clientData||[]) as Client[]);setLoading(false);
  }
  useEffect(()=>{load();},[supabase]);

  async function createTask(e:React.FormEvent){
    e.preventDefault();if(!supabase||!orgId||!form.title.trim())return;setSaving(true);setError('');
    const {data:{user}}=await supabase.auth.getUser();
    const {error}=await supabase.from('tasks').insert({organization_id:orgId,title:form.title.trim(),description:form.description.trim()||null,type:form.type,status:'todo',priority:form.priority,waiting_for:form.waiting_for,due_at:form.due_at?new Date(form.due_at).toISOString():null,client_id:form.client_id||null,assignee_user_id:user?.id||null});
    if(error)setError(error.message);else{setForm({title:'',description:'',type:'general',priority:'medium',waiting_for:'internal',due_at:'',client_id:''});setOpen(false);await load();}setSaving(false);
  }

  async function completeTask(id:string){if(!supabase)return;await supabase.from('tasks').update({status:'done',completed_at:new Date().toISOString()}).eq('id',id);await load();}
  async function changeWaiting(id:string,waiting_for:string){if(!supabase)return;await supabase.from('tasks').update({waiting_for}).eq('id',id);await load();}

  const now=new Date();const todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate());const tomorrow=new Date(todayStart);tomorrow.setDate(tomorrow.getDate()+1);
  const visible=tasks.filter(t=>`${t.title} ${t.clients?.name||''} ${t.campaigns?.name||''}`.toLowerCase().includes(query.toLowerCase()));
  const overdue=visible.filter(t=>t.waiting_for==='internal'&&t.due_at&&new Date(t.due_at)<todayStart);
  const today=visible.filter(t=>t.waiting_for==='internal'&&t.due_at&&new Date(t.due_at)>=todayStart&&new Date(t.due_at)<tomorrow);
  const waiting=visible.filter(t=>t.waiting_for!=='internal');
  const upcoming=visible.filter(t=>t.waiting_for==='internal'&&(!t.due_at||new Date(t.due_at)>=tomorrow));
  const columns=[{label:'Atrasadas',items:overdue,tone:'red'},{label:'Hoje',items:today,tone:'amber'},{label:'Próximas',items:upcoming,tone:'blue'},{label:'Aguardando terceiros',items:waiting,tone:'slate'}];
  const fmt=(d:string|null)=>d?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(d)):'Sem prazo';

  return <>
    <div className="page-head"><div><div className="eyebrow">Execução diária</div><h1 className="page-title">Meu Dia</h1><p className="page-subtitle">Tarefas reais separadas do que está esperando cliente, influencer ou financeiro.</p></div><button className="primary-btn keep-text" onClick={()=>setOpen(v=>!v)}>{open?<X size={16}/>:<Plus size={16}/>} {open?'Fechar':'Nova tarefa'}</button></div>
    {open&&<form className="form-card" onSubmit={createTask} style={{marginBottom:16}}><div className="form-section" style={{marginBottom:0,paddingBottom:0,borderBottom:0}}><h3>Nova tarefa</h3><p>Defina quem está segurando a próxima ação para não confundir espera externa com atraso interno.</p><div className="form-grid three"><div className="field"><label>Título *</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div><div className="field"><label>Tipo</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="general">Geral</option><option value="contract">Contrato</option><option value="content">Conteúdo</option><option value="logistics">Logística</option><option value="finance">Financeiro</option><option value="registration">Cadastro</option></select></div><div className="field"><label>Prioridade</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></div><div className="field"><label>Aguardando</label><select value={form.waiting_for} onChange={e=>setForm({...form,waiting_for:e.target.value})}><option value="internal">Interno</option><option value="client">Cliente</option><option value="influencer">Influencer</option><option value="finance">Financeiro/Fornecedor</option></select></div><div className="field"><label>Prazo</label><input type="datetime-local" value={form.due_at} onChange={e=>setForm({...form,due_at:e.target.value})}/></div><div className="field"><label>Cliente</label><select value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})}><option value="">Sem cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="field full"><label>Descrição</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div></div><div className="submit-row"><span className="privacy-note">A tarefa será atribuída ao usuário logado.</span><button className="primary-btn keep-text" disabled={saving}>{saving?'Salvando…':'Criar tarefa'}</button></div></div></form>}
    <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Buscar tarefa..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {error&&<div className="success-box" style={{background:'#fff0f2',color:'#ba3b4d',marginBottom:14}}>{error}</div>}
    <div className="grid-metrics" style={{gridTemplateColumns:'repeat(4,1fr)'}}><div className="metric-card"><div className="metric-top"><span>Atrasadas</span><Clock3 size={15}/></div><div className="metric-value">{overdue.length}</div><div className="metric-meta">exigem ação interna</div></div><div className="metric-card"><div className="metric-top"><span>Para hoje</span><CalendarClock size={15}/></div><div className="metric-value">{today.length}</div><div className="metric-meta">com prazo hoje</div></div><div className="metric-card"><div className="metric-top"><span>Aguardando terceiros</span><Clock3 size={15}/></div><div className="metric-value">{waiting.length}</div><div className="metric-meta">não conta como atraso interno</div></div><div className="metric-card metric-card-accent"><div className="metric-top"><span>Em aberto</span><ClipboardList size={15}/></div><div className="metric-value">{tasks.length}</div><div className="metric-meta">tarefas no workspace</div></div></div>
    {loading?<div className="panel"><div className="panel-body">Carregando tarefas…</div></div>:<div className="kanban">{columns.map(col=><div className="kanban-col" key={col.label}><div className="kanban-head"><span>{col.label}</span><span>{col.items.length}</span></div>{col.items.map(t=>{const Icon=taskIcon(t.type);return <div className="kanban-card" key={t.id}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><Badge tone={priorityTone(t.priority) as any}>{priorityLabel(t.priority)}</Badge><Icon size={14}/></div><h4 style={{marginTop:10,marginBottom:4}}>{t.title}</h4><p style={{margin:0}}>{t.clients?.name||'Sem cliente'}{t.campaigns?.name?` · ${t.campaigns.name}`:''}</p><div className="kanban-card-bottom"><div><p style={{margin:0}}>Prazo</p><strong style={{fontSize:10}}>{fmt(t.due_at)}</strong></div><button className="icon-btn" onClick={()=>completeTask(t.id)} title="Concluir"><CheckCircle2 size={15}/></button></div>{t.waiting_for!=='internal'?<div style={{marginTop:9,display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><Badge tone="blue">Aguardando {t.waiting_for}</Badge><button className="ghost-btn" onClick={()=>changeWaiting(t.id,'internal')}>Voltou pra mim</button></div>:<div style={{marginTop:8,display:'flex',gap:5,flexWrap:'wrap'}}><button className="ghost-btn" onClick={()=>changeWaiting(t.id,'client')}>Esperar cliente</button><button className="ghost-btn" onClick={()=>changeWaiting(t.id,'influencer')}>Esperar creator</button></div>}</div>})}</div>)}</div>}
  </>;
}
