import { tasks } from '@/lib/demo-data';
import { Badge } from '@/components/ui';
import { Search, Filter, Plus, Clock3, FileCheck2, Package, MessageSquareText, CircleDollarSign, ClipboardList, CalendarClock } from '@/components/icons';

const columns=[
  {key:'Atrasada',label:'Atrasadas',tone:'red'},
  {key:'Hoje',label:'Hoje',tone:'amber'},
  {key:'Próxima',label:'Próximas',tone:'blue'},
  {key:'Aguardando',label:'Aguardando terceiros',tone:'slate'},
];
const taskIcon=(type:string)=>type==='Contrato'?FileCheck2:type==='Logística'?Package:type==='Conteúdo'?MessageSquareText:type==='Financeiro'?CircleDollarSign:ClipboardList;
export default function Operacoes(){const waiting=tasks.filter(t=>t.waitingFor!=='Interno');return <>
  <div className="page-head"><div><div className="eyebrow">Execução diária</div><h1 className="page-title">Meu Dia</h1><p className="page-subtitle">Tudo que você precisa fazer, separado do que está esperando cliente, influencer ou financeiro.</p></div><button className="primary-btn keep-text"><Plus size={16}/> Nova tarefa</button></div>
  <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Buscar tarefa..."/></div><button className="filter-btn"><Filter size={15}/> Responsável</button><button className="filter-btn"><Filter size={15}/> Cliente</button><button className="filter-btn"><Filter size={15}/> Tipo</button></div>
  <div className="grid-metrics" style={{gridTemplateColumns:'repeat(4,1fr)'}}><div className="metric-card"><div className="metric-top"><span>Atrasadas</span><Clock3 size={15}/></div><div className="metric-value">1</div><div className="metric-meta">exige ação imediata</div></div><div className="metric-card"><div className="metric-top"><span>Para hoje</span><CalendarClock size={15}/></div><div className="metric-value">4</div><div className="metric-meta">3 internas · 1 aguardando</div></div><div className="metric-card"><div className="metric-top"><span>Aguardando terceiros</span><Clock3 size={15}/></div><div className="metric-value">3</div><div className="metric-meta">não conta como atraso interno</div></div><div className="metric-card metric-card-accent"><div className="metric-top"><span>Concluídas hoje</span><ClipboardList size={15}/></div><div className="metric-value">7</div><div className="metric-meta">operação avançando</div></div></div>
  <div className="kanban">{columns.map(col=>{let items=col.key==='Aguardando'?waiting:tasks.filter(t=>t.status===col.key&&t.waitingFor==='Interno');return <div className="kanban-col" key={col.key}><div className="kanban-head"><span>{col.label}</span><span>{items.length}</span></div>{items.map(t=>{const Icon=taskIcon(t.type);return <div className="kanban-card" key={`${col.key}-${t.id}`}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><Badge tone={t.priority==='Alta'?'red':t.priority==='Média'?'amber':'slate'}>{t.type}</Badge><Icon size={14}/></div><h4 style={{marginTop:10}}>{t.title}</h4><p>{t.client} · {t.campaign}</p><div className="kanban-card-bottom"><div><p>Prazo</p><strong style={{fontSize:10}}>{t.due}</strong></div><div className="mini-avatar">{t.assignee.slice(0,2).toUpperCase()}</div></div>{col.key==='Aguardando'&&<div style={{marginTop:8}}><Badge tone="blue">Aguardando {t.waitingFor}</Badge></div>}</div>})}</div>})}</div>
</>}
