'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { navItems } from '@/lib/demo-data';
import { iconMap, Search, Bell, ChevronDown, Plus, Settings, Menu, X, CalendarDays, LogOut } from './icons';
import BrandLogo from './brand-logo';

const groups = [
  { label: 'Hoje', items: navItems.slice(0, 2) },
  { label: 'Operação', items: navItems.slice(2, 5) },
  { label: 'Gestão', items: navItems.slice(5) },
];

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

  if (publicRoute) return <main className="public-page">{children}</main>;

  if (loadingAuth) return <div className="auth-screen"><div className="auth-loading"><BrandLogo size={62} priority/><strong>Arcana OS</strong><span>Carregando seu workspace…</span></div></div>;

  if (!supabase) return <div className="auth-screen"><div className="auth-panel"><BrandLogo size={70} priority/><div className="eyebrow">Configuração necessária</div><h1>Conecte o Supabase</h1><p>As variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY precisam estar configuradas no Vercel.</p></div></div>;

  if (!user) return <div className="auth-screen">
    <div className="auth-brand-panel"><div><BrandLogo size={76} priority/><div className="auth-kicker">ARCANA · INFLUENCER OPERATIONS</div><h1>Operação inteira.<br/>Em um só lugar.</h1><p>Clientes, campanhas, creators, contratos, conteúdos, logística, arquivos e tarefas — com rastreabilidade de ponta a ponta.</p></div><div className="auth-proof"><span>Workspace protegido</span><span>Supabase Auth</span><span>Google Drive integrado</span></div></div>
    <form className="auth-panel" onSubmit={signIn}>
      <BrandLogo size={58}/><div className="eyebrow">Acesso interno</div><h2>Entrar no Arcana OS</h2><p>Use um usuário cadastrado em Authentication → Users no Supabase.</p>
      <label className="auth-field"><span>E-mail</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com" autoComplete="email" required/></label>
      <label className="auth-field"><span>Senha</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" required/></label>
      {authError && <div className="auth-error">{authError}</div>}
      <button className="primary-btn auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Entrando…' : 'Entrar no sistema'}</button>
      <small>O acesso é validado diretamente pelo Supabase Auth e a sessão fica salva com segurança no navegador.</small>
    </form>
  </div>;

  const displayName = String(user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário');
  const initials = displayName.split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase();

  return <div className="app-shell">
    <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <BrandLogo size={44} priority />
        <div className="brand-copy"><strong>Arcana OS</strong><span>Influencer Operations</span></div>
        <button className="mobile-close" onClick={() => setMobile(false)} aria-label="Fechar menu"><X size={19}/></button>
      </div>

      <nav className="nav">
        {groups.map(group => <div className="nav-group" key={group.label}>
          <div className="nav-label">{group.label}</div>
          {group.items.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return <Link key={item.label} href={item.href} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setMobile(false)}>
              <span className="nav-icon"><Icon size={17}/></span><span>{item.label}</span>
            </Link>
          })}
        </div>)}
      </nav>

      <div className="sidebar-bottom">
        <Link href="/formularios/cadastro" className="quick-link"><Plus size={16}/> Formulário influencer</Link>
        <Link href="/configuracoes/integracoes" className={`nav-item ${pathname.startsWith('/configuracoes') ? 'active' : ''}`}>
          <span className="nav-icon"><Settings size={17}/></span><span>Configurações</span>
        </Link>
        <div className="user-card">
          <div className="avatar">{initials || 'US'}</div>
          <div className="user-card-copy"><strong>{displayName}</strong><span>{user.email}</span></div>
          <button onClick={signOut} className="user-logout" title="Sair" aria-label="Sair"><LogOut size={15}/></button>
        </div>
      </div>
    </aside>

    <div className="main-wrap">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobile(true)} aria-label="Abrir menu"><Menu size={20}/></button>
        <div className="global-search"><Search size={16}/><input placeholder="Buscar influenciadores, campanhas, clientes..."/><kbd>⌘ K</kbd></div>
        <div className="top-actions">
          <div className="session-pill"><span className="session-dot"/> Online</div>
          <button className="icon-btn" aria-label="Calendário"><CalendarDays size={17}/></button>
          <button className="icon-btn" aria-label="Notificações"><Bell size={17}/><span className="dot"/></button>
          <Link href="/operacoes" className="primary-btn"><Plus size={16}/> Nova tarefa</Link>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>

    <nav className="mobile-bottom-nav" aria-label="Navegação principal">
      {navItems.slice(0,5).map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return <Link key={item.label} href={item.href} className={active ? 'active' : ''}><Icon size={19}/><span>{item.label}</span></Link>
      })}
    </nav>

    {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Fechar menu"/>}
  </div>
}
