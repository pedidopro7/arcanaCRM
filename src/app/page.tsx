import Link from 'next/link';
import { campaigns, tasks } from '@/lib/demo-data';
import { MetricCard, Badge, Progress, SectionTitle } from '@/components/ui';
import { BriefcaseBusiness, Users, FileCheck2, CircleAlert, ArrowUpRight, Clock3, Package, MessageSquareText, CircleDollarSign, ClipboardList } from '@/components/icons';

const tone = (s:string) => s.includes('execução') ? 'green' : s.includes('Planejamento') ? 'blue' : 'slate';
const taskIcon = (type:string) => type==='Contrato'?FileCheck2:type==='Logística'?Package:type==='Conteúdo'?MessageSquareText:type==='Financeiro'?CircleDollarSign:ClipboardList;

export default function Dashboard(){
  return <>
    <div className="page-head">
      <div><div className="eyebrow">Terça-feira · 11 de agosto</div><h1 className="page-title">Visão geral da operação</h1><p className="page-subtitle">O que precisa de atenção agora, sem precisar abrir planilhas ou procurar em pastas.</p></div>
      <div className="head-actions"><Link href="/campanhas" className="secondary-btn">Ver campanhas</Link><Link href="/operacoes" className="primary-btn keep-text">Abrir meu dia <ArrowUpRight size={16}/></Link></div>
    </div>

    <div className="grid-metrics">
      <MetricCard label="Clientes ativos" value={8} meta="4 com campanhas em andamento" icon={<BriefcaseBusiness size={16}/>}/>
      <MetricCard label="Influenciadores ativos" value={42} meta="11 aguardando alguma ação" icon={<Users size={16}/>}/>
      <MetricCard label="Contratos pendentes" value={6} meta="2 precisam ser preparados hoje" icon={<FileCheck2 size={16}/>}/>
      <MetricCard label="Precisa de atenção" value={9} meta="2 atrasadas · 7 para hoje" icon={<CircleAlert size={16}/>} accent/>
    </div>

    <div className="two-col">
      <section className="panel">
        <div className="panel-head"><div><div className="panel-title">Campanhas em andamento</div><div className="panel-sub">Andamento consolidado das campanhas que estão movimentando a operação.</div></div><Link className="ghost-btn" href="/campanhas">Ver todas <ArrowUpRight size={15}/></Link></div>
        <div>{campaigns.map(c=><Link key={c.id} href={`/campanhas/${c.id}`} className="campaign-card" style={{display:'block',textDecoration:'none',color:'inherit'}}>
          <div className="campaign-row"><div><div className="campaign-name">{c.name}</div><div className="campaign-client">{c.client} · {c.phase}</div></div><Badge tone={tone(c.status) as any}>{c.status}</Badge></div>
          <div className="campaign-stats"><div className="campaign-stat"><strong>{c.mapped}</strong><span>Mapeados</span></div><div className="campaign-stat"><strong>{c.sent}</strong><span>Enviados</span></div><div className="campaign-stat"><strong>{c.approved}</strong><span>Aprovados</span></div><div className="campaign-stat"><strong>{c.contracted}</strong><span>Contratos</span></div><div className="campaign-stat"><strong>{c.published}</strong><span>Publicados</span></div></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center',gap:12}}><Progress value={c.progress}/><span style={{fontSize:10,color:'#777'}}>{c.progress}% · prazo {c.deadline}</span></div>
        </Link>)}</div>
      </section>

      <section className="panel">
        <div className="panel-head"><div><div className="panel-title">Meu dia</div><div className="panel-sub">Prioridades ordenadas pelo que exige ação.</div></div><Link className="ghost-btn" href="/operacoes">Abrir</Link></div>
        <div className="panel-body task-list">{tasks.slice(0,5).map(t=>{const Icon=taskIcon(t.type);return <div className="task-row" key={t.id}><div className="task-icon"><Icon size={14}/></div><div><div className="task-title">{t.title}</div><div className="task-meta"><span>{t.client}</span><span>•</span><span>{t.waitingFor}</span></div></div><div className={`task-due ${t.status==='Atrasada'?'overdue':''}`}>{t.due}</div></div>})}</div>
      </section>
    </div>

    <SectionTitle eyebrow="Controle" title="Pendências por etapa" description="Onde a operação está acumulando trabalho agora." />
    <div className="grid-metrics">
      <MetricCard label="Aguardando cliente" value={5} meta="casting e aprovações" icon={<Clock3 size={16}/>}/>
      <MetricCard label="Aguardando influencer" value={4} meta="dados, conteúdo e NF" icon={<Users size={16}/>}/>
      <MetricCard label="Logística" value={3} meta="produtos a enviar" icon={<Package size={16}/>}/>
      <MetricCard label="Conteúdo" value={7} meta="roteiros e versões em fluxo" icon={<MessageSquareText size={16}/>}/>
    </div>
  </>
}
