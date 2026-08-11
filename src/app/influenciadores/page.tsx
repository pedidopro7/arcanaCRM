import Link from 'next/link';
import { influencers } from '@/lib/demo-data';
import { Search, Filter, Plus, MoreHorizontal } from '@/components/icons';
import { Badge } from '@/components/ui';

const tone=(status:string)=>status==='Em campanha'?'green':status.includes('contrato')?'amber':status.includes('cliente')?'blue':status.includes('incompleto')?'red':'slate';
export default function Influencers(){return <>
  <div className="page-head"><div><div className="eyebrow">Base de creators</div><h1 className="page-title">Influenciadores</h1><p className="page-subtitle">Cadastro único, histórico por marca e visão clara do momento de cada creator.</p></div><div className="head-actions"><Link href="/formularios/cadastro" className="secondary-btn">Abrir formulário</Link><button className="primary-btn keep-text"><Plus size={16}/> Novo influencer</button></div></div>
  <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Nome, @, nicho ou cidade..."/></div><button className="filter-btn"><Filter size={15}/> Status</button><button className="filter-btn"><Filter size={15}/> Nicho</button><button className="filter-btn"><Filter size={15}/> Cliente</button></div>
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>Influencer</th><th>Nicho</th><th>Base</th><th>Status</th><th>Campanha atual</th><th>Contrato</th><th>Histórico</th><th></th></tr></thead><tbody>{influencers.map(i=><tr key={i.id}><td><Link href={`/influenciadores/${i.id}`} className="person" style={{textDecoration:'none',color:'inherit'}}><div className="mini-avatar">{i.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div className="name-cell"><strong>{i.name}</strong><span>{i.handle} · {i.city}</span></div></Link></td><td>{i.niche}</td><td>{i.followers}</td><td><Badge tone={tone(i.status) as any}>{i.status}</Badge></td><td><div className="name-cell"><strong>{i.client}</strong><span>{i.campaign}</span></div></td><td>{i.contract}</td><td><Badge tone={i.score==='Preferido'?'violet':'slate'}>{i.score}</Badge></td><td><MoreHorizontal size={16}/></td></tr>)}</tbody></table></div>
</>}
