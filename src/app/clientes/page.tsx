import Link from 'next/link';
import { clients } from '@/lib/demo-data';
import { Search, Filter, Plus, ArrowUpRight } from '@/components/icons';
import { Badge } from '@/components/ui';

export default function Clientes(){return <>
  <div className="page-head"><div><div className="eyebrow">Base da agência</div><h1 className="page-title">Clientes</h1><p className="page-subtitle">Cada marca funciona como um workspace com campanhas, creators, arquivos, contratos e histórico.</p></div><button className="primary-btn keep-text"><Plus size={16}/> Novo cliente</button></div>
  <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Buscar cliente..."/></div><button className="filter-btn"><Filter size={15}/> Filtros</button></div>
  <div className="client-grid">{clients.map(c=><Link href={`/clientes/${c.id}`} key={c.id} className="client-card"><div className="client-card-top"><div className="client-logo">{c.initials}</div><Badge tone="green">Ativo</Badge></div><h3>{c.name}</h3><p>{c.category}</p><div className="client-stats"><div className="client-stat"><strong>{c.activeCampaigns}</strong><span>Campanhas</span></div><div className="client-stat"><strong>{c.influencers}</strong><span>Creators</span></div><div className="client-stat"><strong>{c.pending}</strong><span>Pendências</span></div></div><div className="client-bottom"><span>Resp. {c.owner}</span><span>Próximo prazo {c.nextDeadline} <ArrowUpRight size={11} style={{display:'inline'}}/></span></div></Link>)}</div>
</>}
