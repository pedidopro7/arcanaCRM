import { Badge } from '@/components/ui';
import { Search, Filter, UploadCloud, FolderOpen, ExternalLink, FileText, ImageIcon, FileSpreadsheet, MoreHorizontal, Cloud } from '@/components/icons';
const files=[
 {name:'Contrato_Ana_Silva_assinado.pdf',type:'Contrato',client:'Vans',campaign:'Knu Skool — Agosto',creator:'Ana Silva',updated:'08 ago',where:'Drive'},
 {name:'Briefing_KnuSkool_v3.pdf',type:'Briefing',client:'Vans',campaign:'Knu Skool — Agosto',creator:'—',updated:'06 ago',where:'Drive'},
 {name:'Casting_BackToSchool.xlsx',type:'Planilha',client:'Vans',campaign:'Back to School 2026',creator:'—',updated:'Hoje',where:'Drive'},
 {name:'V1_Diego_Reis.mp4',type:'Conteúdo',client:'Marca Nova',campaign:'Glow Launch',creator:'Diego Reis',updated:'Hoje',where:'Drive'},
];
const Icon=({type}:{type:string})=>type==='Planilha'?<FileSpreadsheet size={17}/>:type==='Conteúdo'?<ImageIcon size={17}/>:<FileText size={17}/>;
export default function Arquivos(){return <>
 <div className="page-head"><div><div className="eyebrow">Google Drive como repositório</div><h1 className="page-title">Arquivos</h1><p className="page-subtitle">O sistema organiza e referencia; os documentos continuam armazenados na estrutura oficial do Drive.</p></div><button className="primary-btn keep-text"><UploadCloud size={16}/> Subir arquivo</button></div>
 <div className="panel" style={{marginBottom:16}}><div className="panel-body"><div className="integration-card" style={{border:0,padding:0}}><div className="integration-icon"><Cloud size={21}/></div><div className="integration-info"><strong>Google Drive</strong><span>Integração preparada. Ao conectar a conta, uploads podem criar a estrutura Cliente → Campanha → Creator automaticamente.</span></div><Badge tone="amber">Configuração pendente</Badge></div></div></div>
 <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Buscar arquivo..."/></div><button className="filter-btn"><Filter size={15}/> Tipo</button><button className="filter-btn"><Filter size={15}/> Cliente</button></div>
 <div className="panel table-wrap"><table className="data-table"><thead><tr><th>Arquivo</th><th>Tipo</th><th>Cliente / campanha</th><th>Influencer</th><th>Atualização</th><th>Armazenamento</th><th></th></tr></thead><tbody>{files.map(f=><tr key={f.name}><td><div className="person"><div className="task-icon"><Icon type={f.type}/></div><strong>{f.name}</strong></div></td><td><Badge>{f.type}</Badge></td><td><div className="name-cell"><strong>{f.client}</strong><span>{f.campaign}</span></div></td><td>{f.creator}</td><td>{f.updated}</td><td><button className="ghost-btn" style={{height:30,padding:'0 6px'}}>{f.where} <ExternalLink size={12}/></button></td><td><MoreHorizontal size={16}/></td></tr>)}</tbody></table></div>
 </>}
