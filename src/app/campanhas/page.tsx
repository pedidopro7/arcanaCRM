import Link from 'next/link';
import { campaigns } from '@/lib/demo-data';
import { Search, Filter, Plus, MoreHorizontal } from '@/components/icons';
import { Badge, Progress } from '@/components/ui';

export default function Campanhas(){return <>
  <div className="page-head"><div><div className="eyebrow">Operação</div><h1 className="page-title">Campanhas</h1><p className="page-subtitle">Do briefing até os resultados, com todas as etapas visíveis no mesmo lugar.</p></div><button className="primary-btn keep-text"><Plus size={16}/> Nova campanha</button></div>
  <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Buscar campanha ou cliente..."/></div><button className="filter-btn"><Filter size={15}/> Cliente</button><button className="filter-btn"><Filter size={15}/> Status</button></div>
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>Campanha</th><th>Status</th><th>Etapa atual</th><th>Aprovados</th><th>Contratados</th><th>Progresso</th><th>Prazo</th><th></th></tr></thead><tbody>{campaigns.map(c=><tr key={c.id}><td><Link href={`/campanhas/${c.id}`} style={{textDecoration:'none',color:'inherit'}} className="name-cell"><strong>{c.name}</strong><span>{c.client}</span></Link></td><td><Badge tone={c.status==='Em execução'?'green':'blue'}>{c.status}</Badge></td><td>{c.phase}</td><td>{c.approved}/{c.sent}</td><td>{c.contracted}</td><td style={{minWidth:140}}><div style={{display:'flex',alignItems:'center',gap:9}}><Progress value={c.progress}/><span>{c.progress}%</span></div></td><td>{c.deadline}</td><td><MoreHorizontal size={16}/></td></tr>)}</tbody></table></div>
</>}
