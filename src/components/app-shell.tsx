'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { navItems } from '@/lib/demo-data';
import { iconMap, Search, Bell, Plus, Settings, Menu, X, CalendarDays, LogOut, Package, MessageSquareText, CircleDollarSign, UserCheck } from './icons';
import BrandLogo from './brand-logo';

type NavItem={label:string;href:string;icon:string};
const extraOperation:NavItem[]=[
  {label:'Logística',href:'/logistica',icon:'package'},
  {label:'Conteúdos',href:'/conteudos',icon:'content'},
];
const extraManagement:NavItem[]=[{label:'Financeiro',href:'/financeiro',icon:'finance'}];
const groups=[
  {label:'Hoje',items:navItems.slice(0,2) as NavItem[]},
  {label:'Operação',items:[...(navItems.slice(2,5) as NavItem[]),...extraOperation]},
  {label:'Gestão',items:[...(navItems.slice(5) as NavItem[]),...extraManagement]},
];
const extraIcons={package:Package,content:MessageSquareText,finance:CircleDollarSign};

const authCss = `
.auth-screen{min-height:100vh;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(420px,.88fr);background:#f7f8fc;color:#171a2b}
.auth-brand-panel{min-height:100vh;padding:clamp(38px,6vw,88px);display:flex;flex-direction:column;justify-content:space-between;color:#fff;background:radial-gradient(circle at 15% 14%,rgba(243,77,109,.32),transparent 27%),radial-gradient(circle at 82% 75%,rgba(112,66,160,.35),transparent 33%),linear-gradient(135deg,#0d1c58,#252b7a 48%,#6f3f94 76%,#c23d7f);overflow:hidden}
.auth-brand-panel h1{margin:25px 0 14px;font-size:clamp(42px,5vw,72px);line-height:.98;letter-spacing:-.055em;max-width:760px}.auth-brand-panel p{max-width:680px;font-size:14px;line-height:1.75;color:rgba(255,255,255,.74)}
.auth-kicker{margin-top:28px;font-size:10px;font-weight:800;letter-spacing:.18em;color:rgba(255,255,255,.62)}.auth-proof{display:flex;gap:8px;flex-wrap:wrap}.auth-proof span{padding:8px 10px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.08);font-size:9px;font-weight:700;color:rgba(255,255,255,.8)}
.auth-panel{width:min(430px,calc(100% - 48px));margin:auto;padding:34px;border:1px solid #e7e8f0;border-radius:22px;background:#fff;box-shadow:0 24px 70px rgba(28,31,67,.08)}.auth-panel h1,.auth-panel h2{margin:8px 0 8px;font-size:28px;letter-spacing:-.04em}.auth-panel>p{margin:0 0 22px;color:#6b6f82;font-size:11px;line-height:1.65}.auth-panel small{display:block;margin-top:14px;color:#8a8e9e;font-size:9px;line-height:1.55}
.auth-field{display:flex;flex-direction:column;gap:7px;margin-top:13px}.auth-field span{font-size:9px;font-weight:750;color:#505467}.auth-field input{height:44px;padding:0 12px;border:1px solid #dfe1eb;border-radius:11px;outline:none;background:#fff;color:#171a2b}.auth-field input:focus{border-color:rgba(112,66,160,.48);box-shadow:0 0 0 4px rgba(112,66,160,.07)}.auth-error{margin-top:12px;padding:10px 12px;border-radius:10px;background:#fff0f2;color:#ba3b4d;font-size:10px}.auth-submit{width:100%;margin-top:17px;min-height:44px}.auth-loading{grid-column:1/-1;margin:auto;display:flex;flex-direction:column;align-items:center;gap:9px}.auth-loading strong{font-size:17px}.auth-loading span{font-size:10px;color:#74788a}
.user-card-copy{min-width:0}.user-card-copy strong,.user-card-copy span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.user-logout{width:30px;height:30px;display:grid;place-items:center;border:0;border-radius:9px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.7);cursor:pointer}.user-logout:hover{background:rgba(255,255,255,.13);color:#fff}.session-pill{display:flex;align-items:center;gap:6px;padding:0 9px;height:30px;border-radius:999px;background:#eaf7f0;color:#19734f;font-size:9px;font-weight:750}.session-dot{width:6px;height:6px;border-radius:50%;background:#25a46f}
@media(max-width:860px){.auth-screen{grid-template-columns:1fr}.auth-brand-panel{display:none}.auth-panel{margin:8vh auto}.session-pill{display:none}}
`;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const publicRoute = pathname.startsWith('/formularios/cadastro');
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    return createBrowserClient(url, key);
  }, []);

  useEffect(() => {
    if (publicRoute) { setLoadingAuth(false); return; }
    if (!supabase) { setLoadingAuth(false); return; }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) { setUser(data.user ?? null); setLoadingAuth(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
      router.refresh();
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [publicRoute, router, supabase]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setAuthError('Supabase ainda não foi configurado no Vercel.'); return; }
    setAuthBusy(true); setAuthError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setAuthError(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error.message);
    else { setUser(data.user); setPassword(''); router.refresh(); }
    setAuthBusy(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  }

  const resolveIcon=(item:NavItem)=>((iconMap as Record<string,React.ComponentType<{size?:number}>>)[item.icon]||(extraIcons as Record<string,React.ComponentType<{size?:number}>>)[item.icon]||Settings);

  if (publicRoute) return <main className="public-page">{children}</main>;
  if (loadingAuth) return <><style>{authCss}</style><div className="auth-screen"><div className="auth-loading"><BrandLogo size={62} priority/><strong>Arcana OS</strong><span>Carregando seu workspace…</span></div></div></>;
  if (!supabase) return <><style>{authCss}</style><div className="auth-screen" style={{gridTemplateColumns:'1fr'}}><div className="auth-panel"><BrandLogo size={70} priority/><div className="eyebrow">Configuração necessária</div><h1>Conecte o Supabase</h1><p>As variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY precisam estar configuradas no Vercel.</p></div></div></>;

  if (!user) return <><style>{authCss}</style><div className="auth-screen">
    <div className="auth-brand-panel"><div><BrandLogo size={76} priority/><div className="auth-kicker">ARCANA · INFLUENCER OPERATIONS</div><h1>Operação inteira.<br/>Em um só lugar.</h1><p>Clientes, campanhas, creators, contratos, conteúdos, logística, arquivos e tarefas — com rastreabilidade de ponta a ponta.</p></div><div className="auth-proof"><span>Workspace protegido</span><span>Supabase Auth</span><span>Google Drive integrado</span></div></div>
    <form className="auth-panel" onSubmit={signIn}>
      <BrandLogo size={58}/><div className="eyebrow" style={{marginTop:16}}>Acesso interno</div><h2>Entrar no Arcana OS</h2><p>Use um usuário cadastrado em Authentication → Users no Supabase.</p>
      <label className="auth-field"><span>E-mail</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com" autoComplete="email" required/></label>
      <label className="auth-field"><span>Senha</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" required/></label>
      {authError && <div className="auth-error">{authError}</div>}
      <button className="primary-btn auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Entrando…' : 'Entrar no sistema'}</button>
      <small>O acesso é validado diretamente pelo Supabase Auth e a sessão fica salva com segurança no navegador.</small>
    </form>
  </div></>;

  const displayName = String(user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário');
  const initials = displayName.split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase();

  return <><style>{authCss}</style><div className="app-shell">
    <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
      <div className="brand"><BrandLogo size={44} priority /><div className="brand-copy"><strong>Arcana OS</strong><span>Influencer Operations</span></div><button className="mobile-close" onClick={() => setMobile(false)} aria-label="Fechar menu"><X size={19}/></button></div>
      <nav className="nav">{groups.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map((item) => {const Icon=resolveIcon(item);const active=item.href==='/'?pathname==='/':pathname.startsWith(item.href);return <Link key={item.label} href={item.href} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setMobile(false)}><span className="nav-icon"><Icon size={17}/></span><span>{item.label}</span></Link>})}</div>)}</nav>
      <div className="sidebar-bottom"><Link href="/formularios/cadastro" className="quick-link"><Plus size={16}/> Formulário influencer</Link><Link href="/configuracoes/integracoes" className={`nav-item ${pathname==='/configuracoes/integracoes' ? 'active' : ''}`}><span className="nav-icon"><Settings size={17}/></span><span>Integrações</span></Link><Link href="/configuracoes/usuarios" className={`nav-item ${pathname==='/configuracoes/usuarios' ? 'active' : ''}`}><span className="nav-icon"><UserCheck size={17}/></span><span>Equipe & acessos</span></Link><div className="user-card"><div className="avatar">{initials || 'US'}</div><div className="user-card-copy"><strong>{displayName}</strong><span>{user.email}</span></div><button onClick={signOut} className="user-logout" title="Sair" aria-label="Sair"><LogOut size={15}/></button></div></div>
    </aside>
    <div className="main-wrap"><header className="topbar"><button className="mobile-menu" onClick={() => setMobile(true)} aria-label="Abrir menu"><Menu size={20}/></button><div className="global-search"><Search size={16}/><input placeholder="Buscar influenciadores, campanhas, clientes..."/><kbd>⌘ K</kbd></div><div className="top-actions"><div className="session-pill"><span className="session-dot"/> Online</div><button className="icon-btn" aria-label="Calendário"><CalendarDays size={17}/></button><button className="icon-btn" aria-label="Notificações"><Bell size={17}/><span className="dot"/></button><Link href="/operacoes" className="primary-btn"><Plus size={16}/> Nova tarefa</Link></div></header><main className="content">{children}</main></div>
    <nav className="mobile-bottom-nav" aria-label="Navegação principal">{navItems.slice(0,5).map((item) => {const Icon=resolveIcon(item as NavItem);const active=item.href==='/'?pathname==='/':pathname.startsWith(item.href);return <Link key={item.label} href={item.href} className={active ? 'active' : ''}><Icon size={19}/><span>{item.label}</span></Link>})}</nav>
    {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Fechar menu"/>}
  </div></>;
}
