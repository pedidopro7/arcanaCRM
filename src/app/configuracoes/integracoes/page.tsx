import Link from 'next/link';
import { Cloud, Link2, ShieldCheck, ExternalLink } from '@/components/icons';
import { Badge } from '@/components/ui';
export default function Integracoes(){return <>
  <div className="page-head"><div><div className="eyebrow">Configurações</div><h1 className="page-title">Integrações</h1><p className="page-subtitle">Conecte serviços que organizam a operação sem automatizar decisões importantes.</p></div></div>
  <div className="panel"><div className="panel-head"><div><div className="panel-title">Google Workspace</div><div className="panel-sub">Drive e Docs usando OAuth da conta da agência.</div></div></div><div className="panel-body stack">
    <div className="integration-card"><div className="integration-icon"><Cloud size={21}/></div><div className="integration-info"><strong>Google Drive</strong><span>Upload de contratos e arquivos para a pasta correta de Cliente → Campanha → Creator.</span></div><Badge tone="amber">Não conectado</Badge><Link className="secondary-btn" href="/api/google/oauth/start">Conectar</Link></div>
    <div className="integration-card"><div className="integration-icon"><Link2 size={21}/></div><div className="integration-info"><strong>Google Docs</strong><span>Abrir modelos, criar cópias e manter edição/revisão manual dentro do fluxo.</span></div><Badge tone="slate">Via Google OAuth</Badge></div>
    <div className="integration-card"><div className="integration-icon"><ShieldCheck size={21}/></div><div className="integration-info"><strong>Princípio de automação</strong><span>Formulário pode criar cadastro e tarefa; contrato não é gerado nem enviado automaticamente nesta versão.</span></div><Badge tone="green">V1</Badge></div>
  </div></div>
</>}
