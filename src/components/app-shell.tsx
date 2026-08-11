'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { navItems } from '@/lib/demo-data';
import { iconMap, Search, Bell, ChevronDown, Plus, Settings, Menu, X, CalendarDays } from './icons';
import BrandLogo from './brand-logo';

const groups = [
  { label: 'Hoje', items: navItems.slice(0, 2) },
  { label: 'Operação', items: navItems.slice(2, 5) },
  { label: 'Gestão', items: navItems.slice(5) },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const publicRoute = pathname.startsWith('/formularios/cadastro');
  if (publicRoute) return <main className="public-page">{children}</main>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <BrandLogo size={44} priority />
        <div className="brand-copy"><strong>Agency OS</strong><span>Influencer Operations</span></div>
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
              {item.label === 'Meu Dia' && <span className="nav-count">6</span>}
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
          <div className="avatar">PH</div>
          <div><strong>Pedro Henrique</strong><span>Operações</span></div>
          <ChevronDown size={15}/>
        </div>
      </div>
    </aside>

    <div className="main-wrap">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobile(true)} aria-label="Abrir menu"><Menu size={20}/></button>
        <div className="global-search"><Search size={16}/><input placeholder="Buscar influenciadores, campanhas, clientes..."/><kbd>⌘ K</kbd></div>
        <div className="top-actions">
          <button className="icon-btn" aria-label="Calendário"><CalendarDays size={17}/></button>
          <button className="icon-btn" aria-label="Notificações"><Bell size={17}/><span className="dot"/></button>
          <button className="primary-btn"><Plus size={16}/> Nova tarefa</button>
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
