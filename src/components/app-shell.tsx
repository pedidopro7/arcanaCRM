'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { mobileNav, navGroups } from '@/lib/nav';
import { iconMap, Search, Bell, Plus, Settings, Menu, X, CalendarDays, LogOut, PanelLeftClose, PanelLeftOpen, Command, ChevronRight, Users, Link2 } from './icons';
import BrandLogo from './brand-logo';
import { Badge } from './ui';

type SearchResult={id:string;label:string;meta:string;href:string;type:'Cliente'|'Campanha'|'Creator'};

type Notice={id:string;title:string;meta:string;tone:'red'|'amber'|'blue'|'slate'};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname=usePathname();
  const router=useRouter();
  const supabase=useMemo(()=>getSupabaseBrowser(),[]);
  const [user,setUser]=useState<User|null>(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [authBusy,setAuthBusy]=useState(false);
  const [authError,setAuthError]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [mobile,setMobile]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [commandOpen,setCommandOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [results,setResults]=useState<SearchResult[]>([]);
  const [searching,setSearching]=useState(false);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [notices,setNotices]=useState<Notice[]>([]);

  const publicRoute=pathname.startsWith('/formularios/cadastro');

  useEffect(()=>{
    if(publicRoute){setAuthLoading(false);return;}
    if(!supabase){setAuthLoading(false);return;}
    let mounted=true;
    supabase.auth.getUser().then(({data})=>{if(mounted){setUser(data.user||null);setAuthLoading(false)}});
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);setAuthLoading(false)});
    return()=>{mounted=false;listener.subscription.unsubscribe()};
  },[publicRoute,supabase]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCommandOpen(true)}
      if(e.key==='Escape'){setCommandOpen(false);setNotificationsOpen(false);setMobile(false)}
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[]);

  useEffect(()=>{
    if(!supabase||!user)return;
    const load=async()=>{
      const dayEnd=new Date();dayEnd.setHours(23,59,59,999);
      const {data}=await supabase.from('tasks').select('id,title,waiting_for,due_at,priority').neq('status','done').order('due_at',{ascending:true,nullsFirst:false}).limit(8);
      const mapped=(data||[]).map((t:any)=>({id:t.id,title:t.title,meta:t.waiting_for==='internal'?(t.due_at?`Prazo ${new Date(t.due_at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`:'Sem prazo'):`Aguardando ${t.waiting_for}`,tone:t.priority==='high'?'red':t.waiting_for!=='internal'?'blue':'amber'} as Notice));
      setNotices(mapped);
    };
    load();
  },[supabase,user,pathname]);

  useEffect(()=>{
    if(!supabase||!commandOpen||query.trim().length<2){setResults([]);return;}
    const timer=setTimeout(async()=>{
      setSearching(true);const q=query.trim();
      const [c1,c2,c3]=await Promise.all([
        supabase.from('clients').select('id,name,category').ilike('name',`%${q}%`).limit(5),
        supabase.from('campaigns').select('id,name,phase,clients(name)').ilike('name',`%${q}%`).limit(5),
        supabase.from('influencers').select('id,full_name,instagram,niche').or(`full_name.ilike.%${q}%,instagram.ilike.%${q}%`).limit(5),
      ]);
      const r:SearchResult[]=[
        ...(c1.data||[]).map((x:any)=>({id:x.id,label:x.name,meta:x.category||'Cliente',href:`/clientes/${x.id}`,type:'Cliente' as const})),
        ...(c2.data||[]).map((x:any)=>({id:x.id,label:x.name,meta:`${x.clients?.name||'Campanha'} · ${x.phase}`,href:`/campanhas/${x.id}`,type:'Campanha' as const})),
        ...(c3.data||[]).map((x:any)=>({id:x.id,label:x.full_name,meta:`${x.instagram||'Creator'} · ${x.niche||'sem nicho'}`,href:`/influenciadores/${x.id}`,type:'Creator' as const})),
      ];setResults(r);setSearching(false);
    },250);return()=>clearTimeout(timer);
  },[commandOpen,query,supabase]);

  async function signIn(e:React.FormEvent){
    e.preventDefault();if(!supabase)return;setAuthBusy(true);setAuthError('');
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error)setAuthError(error.message==='Invalid login credentials'?'E-mail ou senha inválidos.':error.message);else{setUser(data.user);setPassword('');router.refresh()}
    setAuthBusy(false);
  }
  async function signOut(){if(supabase)await supabase.auth.signOut();setUser(null);router.refresh()}

  if(publicRoute)return <main className="public-page">{children}</main>;
  if(authLoading)return <div className="auth-loading-page"><BrandLogo size={64} priority/><strong>Arcana OS</strong><span>Preparando seu workspace...</span></div>;
  if(!supabase)return <div className="auth-loading-page"><BrandLogo size={64}/><strong>Supabase não configurado</strong><span>Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no Vercel.</span></div>;
  if(!user)return <div className="login-layout">
    <section className="login-art"><div className="login-art-inner"><BrandLogo size={78} priority/><div className="login-kicker">ARCANA · INFLUENCER OPERATIONS</div><h1>Menos procura.<br/>Mais operação.</h1><p>Clientes, campanhas, creators, contratos, conteúdo, logística, financeiro e arquivos em um único fluxo.</p></div><div className="login-chips"><span>Workspace protegido</span><span>Supabase Auth</span><span>Google Drive</span></div></section>
    <form className="login-card" onSubmit={signIn}><BrandLogo size={54}/><div className="eyebrow">Acesso interno</div><h2>Entrar no Arcana</h2><p>Use uma conta cadastrada em Usuários e acessos.</p><label><span>E-mail</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="voce@agencia.com"/></label><label><span>Senha</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required placeholder="Sua senha"/></label>{authError&&<div className="form-error">{authError}</div>}<button className="primary-btn login-submit" disabled={authBusy}>{authBusy?'Entrando...':'Entrar no sistema'}</button><small>A autenticação é feita diretamente pelo Supabase Auth.</small></form>
  </div>;

  const displayName=String(user.user_metadata?.name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Usuário');
  const initials=displayName.split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase();
  const sidebarClass=`sidebar ${collapsed?'sidebar-collapsed':''} ${mobile?'sidebar-open':''}`;

  return <div className={`app-shell ${collapsed?'shell-collapsed':''}`}>
    <aside className={sidebarClass}>
      <div className="brand"><BrandLogo size={42} priority/><div className="brand-copy"><strong>ARCANA</strong><span>Influencer Operations</span></div><button className="mobile-close" onClick={()=>setMobile(false)} aria-label="Fechar"><X size={18}/></button></div>
      <nav className="nav">{navGroups.map(group=><div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item=>{const Icon=iconMap[item.icon as keyof typeof iconMap];const active=item.href==='/'?pathname==='/':pathname.startsWith(item.href);return <Link key={item.href} href={item.href} className={`nav-item ${active?'active':''}`} title={collapsed?item.label:undefined} onClick={()=>setMobile(false)}><span className="nav-icon"><Icon size={17}/></span><span className="nav-text">{item.label}</span></Link>})}</div>)}</nav>
      <div className="sidebar-bottom">
        <Link href="/formularios/cadastro" className="quick-link"><Plus size={16}/><span className="nav-text">Formulário creator</span></Link>
        <Link href="/configuracoes/integracoes" className={`nav-item ${pathname.startsWith('/configuracoes/integracoes')?'active':''}`}><span className="nav-icon"><Link2 size={17}/></span><span className="nav-text">Integrações</span></Link>
        <Link href="/configuracoes/usuarios" className={`nav-item ${pathname.startsWith('/configuracoes/usuarios')?'active':''}`}><span className="nav-icon"><Users size={17}/></span><span className="nav-text">Equipe</span></Link>
        <div className="user-card"><div className="avatar">{initials}</div><div className="user-card-copy"><strong>{displayName}</strong><span>{user.email}</span></div><button className="user-logout" onClick={signOut} aria-label="Sair" title="Sair"><LogOut size={15}/></button></div>
        <button className="sidebar-toggle" onClick={()=>setCollapsed(v=>!v)}>{collapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}<span className="nav-text">{collapsed?'Expandir':'Recolher menu'}</span></button>
      </div>
    </aside>

    <div className="main-wrap">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobile(true)} aria-label="Menu"><Menu size={20}/></button><button className="command-trigger" onClick={()=>setCommandOpen(true)}><Search size={16}/><span>Buscar clientes, campanhas, creators...</span><kbd><Command size={11}/> K</kbd></button><div className="top-actions"><button className="icon-btn desktop-only" aria-label="Calendário"><CalendarDays size={17}/></button><button className="icon-btn" onClick={()=>setNotificationsOpen(v=>!v)} aria-label="Notificações"><Bell size={17}/>{notices.length>0&&<span className="notification-count">{Math.min(notices.length,9)}</span>}</button><Link href="/operacoes" className="primary-btn top-create"><Plus size={16}/><span>Nova tarefa</span></Link></div></header>
      <main className="content">{children}</main>
    </div>

    <nav className="mobile-bottom-nav">{mobileNav.map(item=>{const Icon=iconMap[item.icon as keyof typeof iconMap];const active=item.href==='/'?pathname==='/':pathname.startsWith(item.href);return <Link href={item.href} key={item.href} className={active?'active':''}><Icon size={19}/><span>{item.label}</span></Link>})}<button onClick={()=>setMobile(true)}><Menu size={19}/><span>Mais</span></button></nav>
    {mobile&&<button className="scrim" onClick={()=>setMobile(false)} aria-label="Fechar"/>}

    {commandOpen&&<div className="overlay"><button className="overlay-scrim" onClick={()=>setCommandOpen(false)} aria-label="Fechar"/><section className="command-panel"><div className="command-search"><Search size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Digite pelo menos 2 caracteres..."/><button onClick={()=>setCommandOpen(false)}><X size={16}/></button></div><div className="command-actions"><Link href="/operacoes" onClick={()=>setCommandOpen(false)}><Plus size={15}/> Nova tarefa</Link><Link href="/clientes" onClick={()=>setCommandOpen(false)}><Plus size={15}/> Novo cliente</Link><Link href="/campanhas" onClick={()=>setCommandOpen(false)}><Plus size={15}/> Nova campanha</Link><Link href="/influenciadores" onClick={()=>setCommandOpen(false)}><Plus size={15}/> Novo creator</Link></div><div className="command-results">{searching?<div className="command-state">Buscando...</div>:query.length<2?<div className="command-state">Busque por nome, @ ou campanha. <span>Ctrl/⌘ K abre de qualquer tela.</span></div>:results.length===0?<div className="command-state">Nenhum resultado encontrado.</div>:results.map(r=><Link href={r.href} key={`${r.type}-${r.id}`} onClick={()=>setCommandOpen(false)}><div><Badge tone={r.type==='Cliente'?'blue':r.type==='Campanha'?'violet':'coral'}>{r.type}</Badge><strong>{r.label}</strong><span>{r.meta}</span></div><ChevronRight size={16}/></Link>)}</div></section></div>}

    {notificationsOpen&&<><button className="popover-scrim" onClick={()=>setNotificationsOpen(false)} aria-label="Fechar"/><section className="notification-panel"><div className="notification-head"><div><span className="eyebrow">Central</span><h3>Precisa de atenção</h3></div><button className="icon-btn" onClick={()=>setNotificationsOpen(false)}><X size={15}/></button></div><div className="notification-list">{notices.length===0?<div className="command-state">Nada urgente agora.</div>:notices.map(n=><Link href="/operacoes" key={n.id} onClick={()=>setNotificationsOpen(false)}><span className={`notice-dot notice-${n.tone}`}/><div><strong>{n.title}</strong><span>{n.meta}</span></div></Link>)}</div><Link href="/operacoes" className="notification-footer" onClick={()=>setNotificationsOpen(false)}>Abrir Meu Dia <ChevronRight size={14}/></Link></section></>}
  </div>;
}
